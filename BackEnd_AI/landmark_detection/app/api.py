from fastapi import APIRouter, UploadFile, File, Form
from app.schema import PredictResponse, Category
from app.service import process_landmark_prediction

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def predict_landmarks(
    cloth_id: int = Form(...),
    category: Category = Form(...),
    subCategory: str = Form(...),
    cloth_front: UploadFile = File(...),
    cloth_back: UploadFile = File(...)
):
    return await process_landmark_prediction(
        cloth_id,
        category,
        subCategory,
        cloth_front,
        cloth_back
    )
