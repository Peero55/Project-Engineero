"""
Kiro 3D Asset Generation — CDK Infrastructure Stack

Deploys: S3, DynamoDB, IAM roles, Lambda functions, Step Functions,
SageMaker endpoints, API Gateway, and CloudFront.

Usage:
  cdk deploy --context domain_name=kiro-3d.example.com \
             --context certificate_arn=arn:aws:acm:...
"""

from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as sfn_tasks,
    aws_apigateway as apigw,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_logs as logs,
)
from constructs import Construct


class Kiro3DAssetStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ── S3 Bucket ───────────────────────────────────────────────
        asset_bucket = s3.Bucket(
            self, "AssetBucket",
            bucket_name=f"kiro-3d-assets-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="archive-old-assets",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90),
                        )
                    ],
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.PUT],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                )
            ],
        )

        # ── DynamoDB ─────────────────────────────────────────────────
        jobs_table = dynamodb.Table(
            self, "JobsTable",
            table_name="kiro-3d-jobs",
            partition_key=dynamodb.Attribute(
                name="job_id", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            point_in_time_recovery=True,
        )
        jobs_table.add_global_secondary_index(
            index_name="status-index",
            partition_key=dynamodb.Attribute(
                name="status", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at", type=dynamodb.AttributeType.STRING
            ),
        )

        # ── IAM Roles ───────────────────────────────────────────────
        lambda_role = iam.Role(
            self, "LambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )
        asset_bucket.grant_read_write(lambda_role)
        jobs_table.grant_read_write_data(lambda_role)

        sagemaker_role = iam.Role(
            self, "SageMakerRole",
            assumed_by=iam.ServicePrincipal("sagemaker.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AmazonSageMakerFullAccess"
                ),
            ],
        )
        asset_bucket.grant_read_write(sagemaker_role)

        # ── Lambda: Preprocess (background removal) ──────────────────
        preprocess_fn = _lambda.DockerImageFunction(
            self, "PreprocessFn",
            function_name="kiro-3d-preprocess",
            code=_lambda.DockerImageCode.from_image_asset("lambdas/preprocess"),
            role=lambda_role,
            memory_size=3008,
            timeout=Duration.minutes(5),
            environment={
                "ASSET_BUCKET": asset_bucket.bucket_name,
                "JOBS_TABLE": jobs_table.table_name,
            },
            tracing=_lambda.Tracing.ACTIVE,
        )

        # ── Lambda: Mesh Extraction ──────────────────────────────────
        mesh_extraction_fn = _lambda.DockerImageFunction(
            self, "MeshExtractionFn",
            function_name="kiro-3d-mesh-extraction",
            code=_lambda.DockerImageCode.from_image_asset("lambdas/mesh_extraction"),
            role=lambda_role,
            memory_size=3008,
            timeout=Duration.minutes(10),
            environment={
                "ASSET_BUCKET": asset_bucket.bucket_name,
                "JOBS_TABLE": jobs_table.table_name,
            },
            tracing=_lambda.Tracing.ACTIVE,
        )

        # ── Lambda: API Handler (FastAPI) ────────────────────────────
        api_fn = _lambda.DockerImageFunction(
            self, "ApiFn",
            function_name="kiro-3d-api",
            code=_lambda.DockerImageCode.from_image_asset("lambdas/api"),
            role=lambda_role,
            memory_size=512,
            timeout=Duration.seconds(30),
            environment={
                "ASSET_BUCKET": asset_bucket.bucket_name,
                "JOBS_TABLE": jobs_table.table_name,
                "STATE_MACHINE_ARN": "",  # set after state machine creation
            },
            tracing=_lambda.Tracing.ACTIVE,
        )

        # ── Step Functions: 3D Generation Pipeline ───────────────────
        preprocess_task = sfn_tasks.LambdaInvoke(
            self, "PreprocessTask",
            lambda_function=preprocess_fn,
            output_path="$.Payload",
            retry_on_service_exceptions=True,
        )

        invoke_endpoint_task = sfn_tasks.CallAwsService(
            self, "InvokeModelEndpoint",
            service="sagemaker-runtime",
            action="invokeEndpoint",
            parameters={
                "EndpointName": sfn.JsonPath.string_at("$.endpoint_name"),
                "ContentType": "application/json",
                "Body": sfn.JsonPath.string_at("$.inference_payload"),
            },
            iam_resources=["arn:aws:sagemaker:*:*:endpoint/*"],
            result_path="$.inference_result",
        )

        mesh_extraction_task = sfn_tasks.LambdaInvoke(
            self, "MeshExtractionTask",
            lambda_function=mesh_extraction_fn,
            output_path="$.Payload",
            retry_on_service_exceptions=True,
        )

        model_choice = sfn.Choice(self, "RouteByModelType")
        fast_path = invoke_endpoint_task.next(mesh_extraction_task)

        pipeline_definition = (
            preprocess_task
            .next(model_choice
                .when(sfn.Condition.string_equals("$.model_type", "fast"), fast_path)
                .when(sfn.Condition.string_equals("$.model_type", "high_fidelity"), fast_path)
                .when(sfn.Condition.string_equals("$.model_type", "text_to_3d"), fast_path)
                .otherwise(sfn.Fail(self, "UnknownModelType", error="UnknownModelType"))
            )
        )

        state_machine = sfn.StateMachine(
            self, "Pipeline",
            state_machine_name="kiro-3d-pipeline",
            definition_body=sfn.DefinitionBody.from_chainable(pipeline_definition),
            timeout=Duration.minutes(30),
            tracing_enabled=True,
        )
        state_machine.grant_start_execution(lambda_role)
        api_fn.add_environment("STATE_MACHINE_ARN", state_machine.state_machine_arn)

        # ── API Gateway ──────────────────────────────────────────────
        api = apigw.LambdaRestApi(
            self, "Api",
            handler=api_fn,
            rest_api_name="kiro-3d-api",
            deploy_options=apigw.StageOptions(
                stage_name="v1",
                tracing_enabled=True,
                logging_level=apigw.MethodLoggingLevel.INFO,
            ),
        )

        # ── CloudFront CDN ───────────────────────────────────────────
        distribution = cloudfront.Distribution(
            self, "CDN",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin.with_origin_access_control(asset_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.RestApiOrigin(api),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
                ),
            },
        )

        # ── Outputs ──────────────────────────────────────────────────
        CfnOutput(self, "AssetBucketName", value=asset_bucket.bucket_name)
        CfnOutput(self, "JobsTableName", value=jobs_table.table_name)
        CfnOutput(self, "ApiUrl", value=api.url)
        CfnOutput(self, "CloudFrontDomain", value=distribution.distribution_domain_name)
        CfnOutput(self, "StateMachineArn", value=state_machine.state_machine_arn)


app = App()
Kiro3DAssetStack(app, "Kiro3DAssetStack")
app.synth()
