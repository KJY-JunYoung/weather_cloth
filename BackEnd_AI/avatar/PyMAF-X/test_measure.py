from core.measure_body import measure_full_body_from_params, load_pkl_safe

# 공통 입력
pkl_path = "/home/bill971104/smplify-x/output/results/test4/000.pkl"
params = load_pkl_safe(pkl_path)

# 모델 경로
smplx_neutral_path = "data/smplx/SMPLX_NEUTRAL.npz"
smplx_male_path    = "data/smplx/SMPLX_MALE.npz"

# Neutral 모델 결과
neutral_result = measure_full_body_from_params(params, smplx_neutral_path, gender='neutral')

# Male 모델 결과
male_result = measure_full_body_from_params(params, smplx_male_path, gender='male')

# 결과 출력
print("\n=== Neutral 모델 측정 결과 ===")
for k, v in neutral_result.items():
    print(f"{k}: {v:.2f} cm")

print("\n=== Male 모델 측정 결과 ===")
for k, v in male_result.items():
    print(f"{k}: {v:.2f} cm")
