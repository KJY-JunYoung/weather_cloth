import json
from core.measure_body import measure_full_body_from_params, load_pkl_safe

# 공통 입력
json_path = "./test/test.json"
with open(json_path, "r", encoding="utf-8") as f:
    params = json.load(f)

# betas 값 확인
print("Loaded betas:", params.get("betas"))
print("betas length:", len(params.get("betas", [])))

# 모델 경로
smplx_male_path    = "data/smplx/SMPLX_MALE.npz"

# Male 모델 결과
male_result = measure_full_body_from_params(params, smplx_male_path, gender='male')

print("\n=== Male 모델 측정 결과 ===")
for k, v in male_result.items():
    print(f"{k}: {v:.2f} cm")
