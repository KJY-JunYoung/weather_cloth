# render_obj_solid.py
import os
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
    TexturesVertex,
)

# ==== 경로 설정 ====
# smplify-x 폴더에서 실행한다고 가정
OBJ_PATH = "output/meshes/test_rotated/000.obj"
OUT_PATH = "rendered_obj.png"

# ==== 렌더 파라미터 ====
IMAGE_SIZE = 800
DIST, ELEV, AZIM = 2.6, 10, 30   # 카메라 거리/높이/방향
POINT_LIGHT = [2.0, 2.0, 2.0]    # 조명 위치
SOLID_RGB = [0.82, 0.83, 0.92]   # 단색(연한 회보라 느낌) [0~1]

device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
print("device:", device)

# ==== OBJ 로드 ====
if not os.path.exists(OBJ_PATH):
    raise FileNotFoundError(os.path.abspath(OBJ_PATH))

mesh = load_objs_as_meshes([OBJ_PATH], device=device)

# ==== 단색 버텍스 텍스처 적용 ====
V = mesh.verts_list()[0].shape[0]           # 정점 개수
color = torch.tensor(SOLID_RGB, dtype=torch.float32, device=device)
verts_rgb = color[None, None, :].repeat(1, V, 1)   # (1, V, 3)
mesh.textures = TexturesVertex(verts_features=verts_rgb)

# ==== 카메라/조명/래스터 설정 ====
R, T = look_at_view_transform(dist=DIST, elev=ELEV, azim=AZIM)
cameras = OpenGLPerspectiveCameras(device=device, R=R, T=T)

lights = PointLights(device=device, location=[POINT_LIGHT])

raster_settings = RasterizationSettings(
    image_size=IMAGE_SIZE,
    blur_radius=0.0,
    faces_per_pixel=1,
)

renderer = MeshRenderer(
    rasterizer=MeshRasterizer(cameras=cameras, raster_settings=raster_settings),
    shader=SoftPhongShader(device=device, cameras=cameras, lights=lights),
)

# ==== 렌더링 ====
with torch.no_grad():
    image = renderer(mesh)  # (1, H, W, 4)
img = image[0, ..., :3].detach().cpu().numpy()

plt.imsave(OUT_PATH, img)
print(f"✅ saved: {OUT_PATH}")
