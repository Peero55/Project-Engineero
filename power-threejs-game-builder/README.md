# Three.js Game Builder — Kiro Power

Build performant 3D web games with Three.js, Blender-based asset pipelines,
AWS-powered 3D generation, and Capacitor mobile deployment. No Unity or Unreal.

## Power Structure

```
power-threejs-game-builder/
├── POWER.md                             # Main power definition + onboarding
├── mcp.json                             # Playwright MCP for visual QA
├── README.md
├── steering/
│   ├── threejs-loaders.md               # GLTF/GLB/Draco loading
│   ├── threejs-animation.md             # AnimationMixer, state machines
│   ├── threejs-postprocessing.md        # Bloom, shaders, EffectComposer
│   └── aws-3d-pipeline-architecture.md  # AWS pipeline guide
└── infra/
    ├── cdk_app.py                       # CDK stack
    └── lambdas/
        ├── api/                         # FastAPI /generate + /status
        ├── preprocess/                  # Background removal (rembg)
        └── mesh_extraction/             # NeRF/implicit → mesh
```

## Installation

### As a Kiro Power

1. Kiro → Powers panel → "Add power from Local Path"
2. Select `power-threejs-game-builder`
3. Mention "threejs" or "3d game" in chat to activate

### AWS Infrastructure

```bash
cd power-threejs-game-builder/infra
pip install aws-cdk-lib constructs
cdk bootstrap
cdk deploy
```

## API Usage

### Generate a 3D asset

```bash
curl -X POST https://<cloudfront>/generate \
  -H "Content-Type: application/json" \
  -d '{"model_type":"fast","input_data":"<base64-image>","mesh_format":"glb"}'
```

### Check status

```bash
curl https://<cloudfront>/status/<job_id>
```

### Model Types

| Type            | Engine   | Speed   | Use Case        |
| --------------- | -------- | ------- | --------------- |
| `fast`          | TripoSR  | <0.5s   | Prototyping     |
| `high_fidelity` | Wonder3D | 2-3 min | Detailed models |
| `text_to_3d`    | Shap-E   | ~30s    | Prompt-to-mesh  |

## Pipeline

```
Input → API GW → FastAPI → Step Functions:
  1. Preprocess (rembg)
  2. SageMaker Inference
  3. Mesh Extraction (trimesh)
  4. S3 → CloudFront CDN
```

## Monitoring

- CloudWatch Logs per Lambda
- X-Ray tracing on Lambdas + Step Functions
- DynamoDB job tracking with status GSI

## Security

- S3 SSE encryption
- IAM least-privilege per service
- CloudFront HTTPS-only
