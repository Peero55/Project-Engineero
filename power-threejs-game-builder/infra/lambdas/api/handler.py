"""
Kiro 3D Asset Generation — FastAPI Lambda Handler

Exposes /generate endpoint that triggers Step Function executions.
Exposes /status/{job_id} for polling job progress.
"""

import os
import json
import uuid
from datetime import datetime, timezone

import boto3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel, Field

app = FastAPI(title="Kiro 3D Asset Generation API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

sfn_client = boto3.client("stepfunctions")
dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")

JOBS_TABLE = os.environ["JOBS_TABLE"]
ASSET_BUCKET = os.environ["ASSET_BUCKET"]
STATE_MACHINE_ARN = os.environ["STATE_MACHINE_ARN"]

MODEL_ENDPOINTS = {
    "fast": "kiro-3d-triposr",
    "high_fidelity": "kiro-3d-wonder3d",
    "text_to_3d": "kiro-3d-shape",
}


class GenerateRequest(BaseModel):
    model_type: str = Field(..., description="fast, high_fidelity, or text_to_3d")
    input_data: str = Field(..., description="Base64 image or text prompt")
    job_id: str | None = Field(default=None)
    mesh_format: str = Field(default="glb", description="obj, glb, or stl")


class GenerateResponse(BaseModel):
    job_id: str
    status: str
    message: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    model_type: str
    mesh_format: str
    output_url: str | None = None
    error_message: str | None = None
    created_at: str
    updated_at: str


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    if request.model_type not in MODEL_ENDPOINTS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model_type. Must be one of: {list(MODEL_ENDPOINTS.keys())}",
        )

    job_id = request.job_id or str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    input_key = f"raw/{job_id}/input.json"
    s3_client.put_object(
        Bucket=ASSET_BUCKET,
        Key=input_key,
        Body=json.dumps({"input_data": request.input_data}),
        ContentType="application/json",
    )

    table = dynamodb.Table(JOBS_TABLE)
    table.put_item(Item={
        "job_id": job_id,
        "status": "pending",
        "model_type": request.model_type,
        "mesh_format": request.mesh_format,
        "input_s3_key": input_key,
        "created_at": now,
        "updated_at": now,
    })

    sfn_client.start_execution(
        stateMachineArn=STATE_MACHINE_ARN,
        name=f"job-{job_id}",
        input=json.dumps({
            "job_id": job_id,
            "model_type": request.model_type,
            "mesh_format": request.mesh_format,
            "input_s3_key": input_key,
            "endpoint_name": MODEL_ENDPOINTS[request.model_type],
            "bucket": ASSET_BUCKET,
        }),
    )

    return GenerateResponse(
        job_id=job_id, status="pending", message="3D generation pipeline started"
    )


@app.get("/status/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    table = dynamodb.Table(JOBS_TABLE)
    response = table.get_item(Key={"job_id": job_id})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Job not found")

    output_url = None
    if item.get("output_s3_key"):
        output_url = f"https://{ASSET_BUCKET}.s3.amazonaws.com/{item['output_s3_key']}"

    return JobStatus(
        job_id=item["job_id"],
        status=item["status"],
        model_type=item["model_type"],
        mesh_format=item.get("mesh_format", "glb"),
        output_url=output_url,
        error_message=item.get("error_message"),
        created_at=item["created_at"],
        updated_at=item["updated_at"],
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


handler = Mangum(app, lifespan="off")
