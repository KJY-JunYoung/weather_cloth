import joblib, numpy as np, cv2, matplotlib.pyplot as plt, os

pkl = "output/test_single3/output.pkl"
img_path = "test/test_single3/test3.jpg"
thr = 0.05

data = joblib.load(pkl)
pts = np.array(data['joints2d'])[0]

img = cv2.imread(img_path)
if img is None:
    raise FileNotFoundError(os.path.abspath(img_path))
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def draw_label(img, text, org, font_scale=0.8):
    font = cv2.FONT_HERSHEY_SIMPLEX
    (w, h), _ = cv2.getTextSize(text, font, font_scale, 2)
    x, y = org
    x2, y2 = x + w + 6, y - h - 6
    overlay = img.copy()
    cv2.rectangle(overlay, (x-3, y+4), (x2, y2), (0,0,0), -1)
    img[:] = cv2.addWeighted(overlay, 0.35, img, 0.65, 0)
    cv2.putText(img, text, (x, y), font, font_scale, (0,0,0), 5, cv2.LINE_AA)
    cv2.putText(img, text, (x, y), font, font_scale, (255,255,0), 3, cv2.LINE_AA)

# === COCO-17 스켈레톤 연결선 추가 ===
EDGES = [
    (5,7),(7,9),        # 왼팔
    (6,8),(8,10),       # 오른팔
    (11,13),(13,15),    # 왼다리
    (12,14),(14,16),    # 오른다리
    (5,6),              # 어깨
    (11,12),            # 골반
    (5,11),(6,12),      # 몸통
    (0,1),(0,2),(1,3),(2,4)  # 머리
]
for a,b in EDGES:
    if a < len(pts) and b < len(pts):
        xa,ya,ca = pts[a]; xb,yb,cb = pts[b]
        if ca > thr and cb > thr:
            cv2.line(img, (int(xa),int(ya)), (int(xb),int(yb)), (0,255,0), 5)

# 점 + 번호 (네 코드 그대로)
for i, (x, y, c) in enumerate(pts):
    if c > thr:
        cv2.circle(img, (int(x), int(y)), 5, (255, 80, 80), -1)
        draw_label(img, str(i), (int(x)+6, int(y)-6), font_scale=2)

plt.figure(figsize=(10,10))
plt.imshow(img); plt.axis('off'); plt.tight_layout()
plt.savefig("pose_overlay_lined_labeled_bold2.png", dpi=250)
print("saved: pose_overlay_lined_labeled_bold2.png")
