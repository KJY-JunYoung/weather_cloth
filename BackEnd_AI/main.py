from fastapi import FastAPI, UploadFile, File
from typing import List
from pydantic import BaseModel

app = FastAPI()

class ModelResponse(BaseModel):
    status: str
    modelUrl: str

@app.post("/mannequin", response_model=ModelResponse)
async def generate_mannequin(image: UploadFile = File(...)):
    contents= await image.read()
    print(f"AI 서버에서 받은 전신사진 이미지: {image.filename}, 크기: {len(contents)} 바이트")
    return {
        "status": "success",
        "modelUrl": "http://15.164.220.164:5000/static/models/fake-user.glb"
    }

@app.post("/cloth-model", response_model=ModelResponse)
async def generate_cloth(image: UploadFile = File(...)):
    contents = await image.read()
    print(f"AI 서버에서 받은 옷 이미지: {image.filename}, 크기: {len(contents)} 바이트")
    return {
        "status": "success",
        "modelUrl": "http://15.164.220.164:5000/static/models/fake-cloth.glb"
    }
