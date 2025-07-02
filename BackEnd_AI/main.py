# main.py
from fastapi import FastAPI  # fastapi 프레임워크 가져옴
from pydantic import BaseModel  # json 형식 검증을 위한 라이브러리

app = FastAPI()

# 요청 데이터 구조 정의
class ModelRequest(BaseModel):
    imageUrl: str

# POST 요청 처리
class ModelResponse(BaseModel):
    status: str
    model3DUrl: str


# POST /make-3d API
@app.post("/make-3d", response_model=ModelResponse)
def make_3d_model(data: ModelRequest):
    print(f"받은 이미지 URL: {data.imageUrl}")

    # 가짜 3D 모델 경로 생성 (실제론 AI 처리 후 결과 경로)
    fake_model_url = "http://localhost:5000/static/models/fake-user.glb"

    return {
        "status": "success",
        "model3DUrl": fake_model_url
    }
# Node.js에선 타입 정의가 없음 → 요청을 직접 파싱하거나, 타입 검증은 따로 해야 함
# 예: req.body.name 사용 (타입 없음, 실수 발생 가능)
#
# Express에는 이런 "요청 스키마 모델"이 없음 → 따로 Joi, zod, yup 등 외부 라이브러리를 써야 함