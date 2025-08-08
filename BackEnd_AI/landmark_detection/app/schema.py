from pydantic import BaseModel
from enum import Enum
from typing import List


class Category(str, Enum):
    blouse = "blouse"
    trousers = "trousers"
    # 필요 시 확장

class PredictResponse(BaseModel):
    keypoints: List[List[float]]
    labels: List[str]
