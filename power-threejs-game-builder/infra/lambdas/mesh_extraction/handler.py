"""
Kiro 3D — Mesh Extraction Lambda

Converts model outputs (NeRFs, implicit functions) into .obj/.glb/.stl
meshes using trimesh, stores results in S3, updates DynamoDB.
"""

import os
import io
import json
import base64
import tempfile
from datetime import datetime, timezone

import boto3
import trimesh
import numpy as np

s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

ASSET_BUCKET = os.environ["ASSET_BUCKET"]
JOBS_TABLE = os.environ["JOBS_TABLE"]

FORMAT_EXT = {"obj": "obj", "glb": "glb", "stl": "stl"}
FORMAT_CT = {
    "obj": "model/obj",
    "glb": "model/gltf-binary",
    "stl": "model/stl",
}


def update_job_status(job_id, status, extra=None):
    table = dynamodb.Table(JOBS_TABLE)
    expr = "SET #s = :s, updated_at = :u"
    vals = {":s": status, ":u": datetime.now(timezone.utc).isoformat()}
    names = {"#s": "status"}
    if extra:
        for k, v in extra.items():
            expr += f", {k} = :{k}"
            vals[f":{k}"] = v
    table.update_item(
        Key={"job_id": job_id},
        UpdateExpression=expr,
        ExpressionAttributeNames=names,
        ExpressionAttributeValues=vals,
    )


def extract_mesh(inference_result: dict) -> trimesh.Trimesh:
    """Parse SageMaker output into trimesh. Supports vertices/faces, point clouds, or serialized mesh."""
    if "vertices" in inference_result and "faces" in inference_result:
        return trimesh.Trimesh(
            vertices=np.array(inference_result["vertices"]),
            faces=np.array(inference_result["faces"]),
        )
    if "point_cloud" in inference_result:
        cloud = trimesh.PointCloud(np.array(inference_result["point_cloud"]))
        return cloud.convex_hull
    if "mesh_data" in inference_result:
        return trimesh.load(
            io.BytesIO(base64.b64decode(inference_result["mesh_data"])),
            file_type="glb",
        )
    raise ValueError("Unrecognized inference output format")


def handler(event, context):
    job_id = event["job_id"]
    mesh_format = event.get("mesh_format", "glb")
    bucket = event.get("bucket", ASSET_BUCKET)
    inference_result = event.get("inference_result", {})

    try:
        update_job_status(job_id, "extracting")

        if isinstance(inference_result, str):
            inference_result = json.loads(inference_result)
        if "Body" in inference_result:
            body = inference_result["Body"]
            if isinstance(body, str):
                inference_result = json.loads(body)

        mesh = extract_mesh(inference_result)

        if len(mesh.faces) > 2000:
            mesh = mesh.simplify_quadric_decimation(1000)

        ext = FORMAT_EXT.get(mesh_format, "glb")
        with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
            mesh.export(tmp.name, file_type=ext)
            mesh_bytes = open(tmp.name, "rb").read()

        output_key = f"meshes/{job_id}/model.{ext}"
        s3_client.put_object(
            Bucket=bucket, Key=output_key, Body=mesh_bytes,
            ContentType=FORMAT_CT.get(mesh_format, "application/octet-stream"),
        )

        final_key = f"final/{job_id}/model.{ext}"
        s3_client.copy_object(
            Bucket=bucket,
            CopySource={"Bucket": bucket, "Key": output_key},
            Key=final_key,
        )

        update_job_status(job_id, "complete", {"output_s3_key": final_key})

        return {
            "job_id": job_id,
            "status": "complete",
            "output_s3_key": final_key,
            "mesh_format": mesh_format,
            "face_count": len(mesh.faces),
            "vertex_count": len(mesh.vertices),
        }
    except Exception as e:
        update_job_status(job_id, "failed", {"error_message": str(e)})
        raise
