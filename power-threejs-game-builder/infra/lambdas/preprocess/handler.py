"""
Kiro 3D — Preprocess Lambda

Removes image backgrounds using rembg, stores masked images in S3,
and updates DynamoDB job status.
"""

import os
import io
import json
import base64
from datetime import datetime, timezone

import boto3
from rembg import remove
from PIL import Image

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

ASSET_BUCKET = os.environ["ASSET_BUCKET"]
JOBS_TABLE = os.environ["JOBS_TABLE"]


def update_job_status(job_id: str, status: str, extra: dict | None = None):
    table = dynamodb.Table(JOBS_TABLE)
    update_expr = "SET #s = :s, updated_at = :u"
    expr_values = {
        ":s": status,
        ":u": datetime.now(timezone.utc).isoformat(),
    }
    expr_names = {"#s": "status"}
    if extra:
        for key, value in extra.items():
            update_expr += f", {key} = :{key}"
            expr_values[f":{key}"] = value
    table.update_item(
        Key={"job_id": job_id},
        UpdateExpression=update_expr,
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )


def handler(event, context):
    job_id = event["job_id"]
    input_s3_key = event["input_s3_key"]
    bucket = event.get("bucket", ASSET_BUCKET)

    try:
        update_job_status(job_id, "preprocessing")

        response = s3_client.get_object(Bucket=bucket, Key=input_s3_key)
        input_data = json.loads(response["Body"].read())
        image_bytes = base64.b64decode(input_data["input_data"])

        input_image = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
        output_image = remove(input_image)

        output_buffer = io.BytesIO()
        output_image.save(output_buffer, format="PNG")
        output_buffer.seek(0)

        preprocessed_key = f"preprocessed/{job_id}/masked.png"
        s3_client.put_object(
            Bucket=bucket,
            Key=preprocessed_key,
            Body=output_buffer.getvalue(),
            ContentType="image/png",
        )

        update_job_status(job_id, "preprocessed", {
            "preprocessed_s3_key": preprocessed_key,
        })

        preprocessed_b64 = base64.b64encode(output_buffer.getvalue()).decode()
        return {
            **event,
            "preprocessed_s3_key": preprocessed_key,
            "inference_payload": json.dumps({
                "image": preprocessed_b64,
                "job_id": job_id,
                "mesh_format": event.get("mesh_format", "glb"),
            }),
        }
    except Exception as e:
        update_job_status(job_id, "failed", {"error_message": str(e)})
        raise
