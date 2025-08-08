from PIL import Image
from fastapi import UploadFile
import os
import uuid
from app.schema import PredictResponse, Category
import sys

# 📌 predictor 상위 폴더에 있을 때
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from predictor import predict_keypoints

# ✅ 경로 생성
def get_cloth_folder(cloth_id: int) -> str:
    path = os.path.join("data", f"cloth_{cloth_id}")
    os.makedirs(path, exist_ok=True)
    return path


# ✅ 이미지 저장 및 리사이즈
def save_image(upload_file: UploadFile, save_path: str, size=(512, 512)) -> str:
    image = Image.open(upload_file.file).convert("RGB")
    image = image.resize(size)
    image.save(save_path)
    return save_path


# ✅ 전체 처리 함수
async def process_landmark_prediction(
    cloth_id: int,
    category: Category,
    sub_category: str,
    cloth_front: UploadFile,
    cloth_back: UploadFile,
):
    folder = get_cloth_folder(cloth_id)

    CKPT_MAP = {
        "blouse": "models/kpt_blouse_020.ckpt",
        "trousers": "models/kpt_trousers_020.ckpt"
    }

    ckpt_path = CKPT_MAP.get(category.value)
    if not ckpt_path:
        raise ValueError(f"[❌] 지원하지 않는 카테고리: {category}")  # 모델 경로는 상황에 맞게
    category_str = category.value

    # 🔹 앞면
    front_path = os.path.join(folder, "cloth_front.jpg")
    save_image(cloth_front, front_path)
    front_json_path = os.path.join(folder, "cloth_front_landmarks.json")
    predict_keypoints(front_path, ckpt_path, category_str, front_json_path)

    # 🔹 뒷면
    back_path = os.path.join(folder, "cloth_back.jpg")
    save_image(cloth_back, back_path)
    back_json_path = os.path.join(folder, "cloth_back_landmarks.json")
    predict_keypoints(back_path, ckpt_path, category_str, back_json_path)

    # 🔁 기본 응답은 프론트 기준으로
    return PredictResponse(
        keypoints=[],  # keypoints 직접 파싱하려면 json 불러와야 함
        labels=[]
    )
