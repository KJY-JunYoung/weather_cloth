import torch
import numpy as np
import matplotlib.pyplot as plt
from pytorch3d.io import load_objs_as_meshes
from pytorch3d.renderer import (
    look_at_view_transform, 
    OpenGLPerspectiveCameras,
    PointLights, 
    RasterizationSettings, 
    MeshRenderer, 
    MeshRasterizer,  
    SoftPhongShader,
    TexturesVertex
)
import os

# -----------------------------
# 경로 설정
# -----------------------------
device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")

# 현재 스크립트 기준 상대 경로
obj_path = os.path.join("output", "meshes", "test_rotated", "000.obj")
texture_path = os.path.join("..", "PyMAF-X", "data", "vertex_texture.npy")

# -----------------------------
# OBJ 로드
# -----------------------------
mesh = load_objs_as_meshes([obj_path], device=device)

# -----------------------------
# vertex_texture.npy 로드 & 적용
# -----------------------------
verts_rgb_np = np.load(texture_path)

# 다차원일 경우 (예: 1, 1, 13776, 2, 2, 2, 3) → (V, 3)으로 변환
if verts_rgb_np.ndim > 2:
    verts_rgb_np = verts_rgb_np.reshape(-1, 3)

# Torch 텐서 변환 후 batch 차원 추가 → (1, V, 3)
verts_rgb = torch.tensor(verts_rgb_np, dtype=torch.float32, device=device).unsqueeze(0)

mesh.textures = TexturesVertex(verts_features=verts_rgb)

# -----------------------------
# 카메라 설정
# -----------------------------
R, T = look_at_view_transform(dist=2.5, elev=15, azim=45)  
cameras = OpenGLPerspectiveCameras(device=device, R=R, T=T)

# -----------------------------
# 조명 설정
# -----------------------------
lights = PointLights(device=device, location=[[2.0, 2.0, 2.0]])

# -----------------------------
# 래스터화 & 셰이딩 설정
# -----------------------------
raster_settings = RasterizationSettings(
    image_size=800, 
    blur_radius=0.0, 
    faces_per_pixel=1
)

# -----------------------------
# 렌더러 생성
# -----------------------------
renderer = MeshRenderer(
    rasterizer=MeshRasterizer(cameras=cameras, raster_settings=raster_settings),
    shader=SoftPhongShader(device=device, cameras=cameras, lights=lights)
)

# -----------------------------
# 렌더링 & 저장
# -----------------------------
image = renderer(mesh)
image = image[0, ..., :3].cpu().numpy()

plt.imsave("rendered_obj.png", image)
print("✅ saved rendered_obj.png")
