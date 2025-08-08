import joblib, numpy as np, matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import smplx

# ===== 튜닝 파라미터 =====
PITCH_DEG = -8     # X축 (앞뒤 숙임)
ROLL_DEG  = +3     # Y축 (어깨 수평 보정)
YAW_DEG   = +4     # Z축 (정면)
FLIP_X    = False  # 좌우 반전 필요시 True

PKL_PATH  = "output/test_single2/output.pkl"
MODEL_DIR = "data/"
OUT_PATH  = "avatar_render_final2.png"

# --- 데이터 로드 ---
data = joblib.load(PKL_PATH)
verts = data['smplx_verts'][0]

# --- SMPL-X faces ---
model = smplx.create(model_path=MODEL_DIR, model_type="smplx",
                     gender="neutral", use_pca=False)
faces = model.faces.astype(np.int64)

# --- 정렬: 중심 -> 세우기(Rx+90) -> 사용자 미세 회전 ---
verts = verts - verts.mean(axis=0)
R_x_plus90 = np.array([[1,0,0],[0,0,1],[0,-1,0]], float)  # Y-up -> Z-up
verts = verts @ R_x_plus90.T

def R_x(d):
    r=np.deg2rad(d); c,s=np.cos(r),np.sin(r)
    return np.array([[1,0,0],[0,c,-s],[0,s,c]], float)
def R_y(d):
    r=np.deg2rad(d); c,s=np.cos(r),np.sin(r)
    return np.array([[c,0,s],[0,1,0],[-s,0,c]], float)
def R_z(d):
    r=np.deg2rad(d); c,s=np.cos(r),np.sin(r)
    return np.array([[c,-s,0],[s,c,0],[0,0,1]], float)

R = R_z(YAW_DEG) @ R_y(ROLL_DEG) @ R_x(PITCH_DEG)
verts = verts @ R.T
if FLIP_X:
    verts[:,0] *= -1

# 바닥(z=0)에 맞춤
verts[:,2] -= verts[:,2].min()

# --- 램버시안 + 3점조명(+보조 림) + 하체 AO ---
tri = verts[faces]                                  # (F,3,3)
n = np.cross(tri[:,1]-tri[:,0], tri[:,2]-tri[:,0])  # (F,3)
n = n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-9)

# 높이 정규화(발=0, 머리=1) → 가짜 AO에 사용
centers = tri.mean(axis=1)
zmin, zmax = verts[:,2].min(), verts[:,2].max()
z_norm = (centers[:,2] - zmin) / (zmax - zmin + 1e-9)

def nrm(v):
    v = np.asarray(v, float)
    return v / (np.linalg.norm(v) + 1e-9)

# 라이트 방향
L_key  = nrm([ 0.15,  0.35,  1.00])   # 정면 위(주광)
L_fill = nrm([-0.60,  0.30,  0.80])   # 좌측 위(보조)
L_rim  = nrm([ 0.00, -0.25, -1.00])   # 뒤(윤곽)
L_rim2 = nrm([ 0.20, -0.30, -0.60])   # 다리 윤곽 강화

I_key  = np.clip(n @ L_key,  0.0, 1.0)
I_fill = np.clip(n @ L_fill, 0.0, 1.0)
I_rim  = np.clip(n @ L_rim,  0.0, 1.0)
I_rim2 = np.clip(n @ L_rim2, 0.0, 1.0)

# 조명 비중: 입체감 ↑(key/rim ↑), 번들거림 ↓(ambient ↓)
ambient = 0.08
inten = (ambient
         + 0.85*I_key
         + 0.12*I_fill
         + 0.22*I_rim
         + 0.10*I_rim2)

# 하체 가짜 AO (발쪽 어둡게 해서 접지감)
ao_strength = 0.10
inten = np.clip(inten - ao_strength*(1.0 - z_norm), 0.0, 1.0)

# 미세 색감 변화(아주 약하게: 키가 클수록 약간 밝게)
inten *= (0.98 + 0.04*z_norm)
inten = np.clip(inten, 0.0, 1.0)

# 감마(중간톤 대비)
gamma = 0.75
inten = np.power(inten, gamma)

# 베이스 컬러 & 최종 면 색상
base = np.array([0.70, 0.72, 0.90])                 # 보랏빛-회색 톤
face_colors = base * (0.25 + 0.75*inten[:,None])

# --- 렌더링 ---
fig = plt.figure(figsize=(8,8))
ax = fig.add_subplot(111, projection='3d')

mesh = Poly3DCollection(tri, linewidths=0.0)
mesh.set_edgecolor('none')
mesh.set_facecolor(face_colors)
mesh.set_alpha(1.0)
ax.add_collection3d(mesh)

# 바닥면(약간 더 어둡게, 분리감 ↑)
s = (verts.max() - verts.min()) * 0.62
gx = np.array([-s, s, s, -s]); gy = np.array([-s, -s, s, s])
gquad = np.stack([gx, gy, np.zeros_like(gx)], axis=1)[None, :, :]
floor = Poly3DCollection(gquad, alpha=0.08)
floor.set_facecolor((0,0,0))
floor.set_edgecolor('none')
ax.add_collection3d(floor)

# 프레이밍 & 카메라
mins, maxs = verts.min(0), verts.max(0)
cent = (mins + maxs) / 2
size = (maxs - mins).max() / 2
margin = 0.10 * size

ax.set_xlim(cent[0]-size-margin, cent[0]+size+margin)
ax.set_ylim(cent[1]-size-margin, cent[1]+size+margin)
ax.set_zlim(0, cent[2]+size+margin)
ax.axis('off')

# 정면(살짝 위)
ax.view_init(elev=8, azim=-90)

plt.tight_layout()
plt.savefig(OUT_PATH, dpi=300)
print(f"✅ saved {OUT_PATH}")
