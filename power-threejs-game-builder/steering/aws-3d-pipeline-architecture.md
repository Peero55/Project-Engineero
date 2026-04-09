---
inclusion: manual
---

# AWS 3D Asset Generation Pipeline — Architecture Guide

## Overview

This pipeline provides a vendor-agnostic, AWS-powered alternative to Meshy.ai for generating
3D assets from images or text prompts. It uses Step Functions to orchestrate preprocessing,
model inference, and mesh extraction.

## Pipeline Flow

```
Client Request
  → API Gateway (REST)
    → FastAPI Lambda (/generate)
      → Step Functions State Machine
        → Preprocess Lambda (background removal via rembg)
        → SageMaker Endpoint (model inference)
        → Mesh Extraction Lambda (NeRF/implicit → .obj/.glb)
        → S3 (final asset storage)
        → DynamoDB (job status update)
      → CloudFront (asset delivery CDN)
```

## Multi-Model Support

| Model    | Type        | Speed   | Quality       | Use Case                    |
| -------- | ----------- | ------- | ------------- | --------------------------- |
| TripoSR  | Image-to-3D | <0.5s   | Good          | Fast iteration, prototyping |
| Wonder3D | Image-to-3D | 2-3 min | High fidelity | Detailed textured models    |
| CRM      | Image-to-3D | 2-3 min | High fidelity | Alternative high-quality    |
| Shap-E   | Text-to-3D  | ~30s    | Medium        | Direct prompt-to-mesh       |

## AWS Services Used

- S3: Raw uploads, preprocessed images, generated meshes, final assets
- DynamoDB: Job tracking (status, timestamps, model type, output paths)
- Lambda: Preprocessing (rembg), mesh extraction (DiffMC/pymesh)
- SageMaker: Model inference endpoints (TripoSR, Wonder3D, Shap-E)
- Step Functions: Pipeline orchestration
- API Gateway: REST interface
- CloudFront: CDN for generated asset delivery
- CloudWatch + X-Ray: Monitoring and tracing
- IAM: Least-privilege roles per service

## DynamoDB Job Schema

```
Table: kiro-3d-jobs
  PK: job_id (String)
  Attributes:
    status: pending | preprocessing | inferring | extracting | complete | failed
    model_type: fast | high_fidelity | text_to_3d
    input_s3_key: String
    preprocessed_s3_key: String
    output_s3_key: String
    mesh_format: obj | glb | stl
    created_at: ISO 8601
    updated_at: ISO 8601
    error_message: String (optional)
    inference_time_ms: Number (optional)
```

## S3 Bucket Structure

```
kiro-3d-assets/
  raw/              # Original uploaded images
  preprocessed/     # Background-removed images
  inference/        # Raw model outputs (NeRF, implicit)
  meshes/           # Extracted .obj/.glb/.stl files
  final/            # Production-ready assets
```

## Security

- All S3 buckets encrypted with SSE-S3
- IAM roles scoped per Lambda/SageMaker with least privilege
- API Gateway with API key or Cognito auth (future)
- CloudFront with signed URLs for private assets

## Cost Controls

- SageMaker Spot training for fine-tuning (70% savings)
- Auto-scaling inference endpoints (scale to zero when idle)
- S3 lifecycle rules: move old assets to Glacier after 90 days
- Lambda concurrency limits to prevent runaway costs
- CloudFront caching to reduce S3 egress
