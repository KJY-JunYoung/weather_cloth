import csv
from itertools import product
from datetime import datetime
from core.measure_body import measure_full_body_from_params

# ===== 설정 =====
smplx_path = "data/smplx/SMPLX_MALE.npz"  # 또는 NEUTRAL
csv_path = f"grid_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

# 어떤 β 인덱스를 어떤 값으로 탐색할지 지정
# 예: 0,1,2번만 -5/0/5 탐색, 나머지는 0 고정
beta_space = {
    0: [-5, 0, 5],
    1: [-5, 0, 5],
    2: [-5, 0, 5],
    3: [-5, 0, 5],
    4: [-5, 0, 5],
    5: [-5, 0, 5],
    6: [-5, 0, 5],
    7: [-5, 0, 5],
    8: [-5, 0, 5],
    9: [-5, 0, 5]
}
fixed = [0.0]*10  # 고정 기본값

# ===== CSV 헤더 =====
beta_cols = [f"beta_{i}" for i in range(10)]
metric_cols = [
    "height_cm","shoulder_width_cm","chest_circumference_cm",
    "waist_circumference_cm","hip_circumference_cm",
    "arm_length_cm","leg_length_cm"
]
fieldnames = beta_cols + metric_cols

with open(csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    
    writer.writeheader()

    # product로 그리드 전개
    varying_idxs = sorted(beta_space.keys())
    for vals in product(*[beta_space[i] for i in varying_idxs]):
        betas = fixed[:]
        for i, v in zip(varying_idxs, vals):
            betas[i] = float(v)

        params = {"betas": betas}
        res = measure_full_body_from_params(params, smplx_path, gender="male")  # or "neutral"

        row = {f"beta_{i}": betas[i] for i in range(10)}
        row.update({k: float(res.get(k, float("nan"))) for k in metric_cols})
        writer.writerow(row)

print(f"CSV 저장 완료: {csv_path}")
