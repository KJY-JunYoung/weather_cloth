from core.measure_body import measure_full_body_from_pkl

# 1. pkl 파일 경로
pkl_path = "output/test_single/output.pkl"

# 2. SMPLX 모델 파일 경로
smplx_model_path = "data/smpl/SMPLX_NEUTRAL_2020.npz"

# 3. 치수 측정 실행
measures = measure_full_body_from_pkl(pkl_path, smplx_model_path)

# 4. 결과 출력
print("=== 측정 결과 ===")
for key, value in measures.items():
    print(f"{key}: {value:.2f} cm")
