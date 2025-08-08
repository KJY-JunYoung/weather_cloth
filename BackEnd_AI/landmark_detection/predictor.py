import os
import sys
import simplejson as json
import base64
from io import BytesIO

import torch
import numpy as np
from PIL import Image
from torchvision import transforms

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from src.config import Config
from src.stage2.cascade_pyramid_network import CascadePyramidNet
from src.pytorch_utils import setgpu

REVERSE_LABEL_MAPS = {
    "blouse": {
        "neckline_left": "ln",
        "center_front": "cn",
        "neckline_right": "rn",
        "shoulder_left": "lso",
        "cuff_left_out": "lpo",
        "cuff_left_in": "lpi",
        "top_hem_left": "lh",
        "shoulder_right": "rso",
        "top_hem_right": "rh",
        "cuff_right_out": "rpo",
        "cuff_right_in": "rpi"
    },
    "trousers": {
        "waistband_left": "lw",
        "waistband_right": "rw",
        "bottom_left_out": "llo",
        "bottom_left_in": "lli",
        "bottom_right_in": "rli",
        "bottom_right:out": "rlo",
        "crotch": "cc",
        "middle_waist": "mw"  # mw도 포함해서 저장
    }
}


def load_model(ckpt_path, config):
    model = CascadePyramidNet(config)
    checkpoint = torch.load(ckpt_path, map_location='cuda', weights_only=False)
    model.load_state_dict(checkpoint['state_dict'])
    model = model.cuda()
    model.eval()
    return model


def preprocess_image(image_path, size=512):
    image = Image.open(image_path).convert("RGB").resize((size, size))
    tensor = transforms.ToTensor()(image).unsqueeze(0).cuda()
    return tensor, np.array(image), os.path.basename(image_path)


def get_keypoints_from_heatmap(heatmap, input_size=512):
    heatmap = heatmap.squeeze().cpu().numpy()
    K, H, W = heatmap.shape
    keypoints = []

    for i in range(K):
        hmap = heatmap[i]
        y, x = np.unravel_index(np.argmax(hmap), hmap.shape)
        x = float(x) * input_size / W
        y = float(y) * input_size / H
        keypoints.append([round(x, 6), round(y, 6)])

    return keypoints


def add_middle_waist(keypoints, labels, category):
    if category == "trousers":
        try:
            lw_idx = labels.index("waistband_left")
            rw_idx = labels.index("waistband_right")
            lw = keypoints[lw_idx]
            rw = keypoints[rw_idx]

            mw = [round((lw[0] + rw[0]) / 2, 6), round((lw[1] + rw[1]) / 2, 6)]
            insert_idx = max(lw_idx, rw_idx) + 1
            keypoints.insert(insert_idx, mw)
            labels.insert(insert_idx, "middle_waist")
        except ValueError:
            print("⚠️ waistband_left 또는 waistband_right가 labels에 없음")

    return keypoints, labels


def save_as_labelme_json(keypoints, labels, category, image_np, image_filename, save_path):
    label_map = REVERSE_LABEL_MAPS.get(category, {})
    converted_labels = [label_map.get(label, label) for label in labels]

    shapes = []
    for label, (x, y) in zip(converted_labels, keypoints):
        shapes.append({
            "label": label,
            "points": [[x, y]],
            "group_id": None,
            "shape_type": "point",
            "flags": {}
        })

    image_pil = Image.fromarray(image_np.astype(np.uint8))
    buffer = BytesIO()
    image_pil.save(buffer, format="JPEG")
    img_str = base64.b64encode(buffer.getvalue()).decode("utf-8")

    output = {
        "version": "4.6.0",
        "flags": {},
        "shapes": shapes,
        "imagePath": image_filename,
        "imageData": img_str,
        "imageHeight": 512,
        "imageWidth": 512
    }

    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    with open(save_path, 'w') as f:
        json.dump(output, f, indent=2, ensure_ascii=False, ignore_nan=True, use_decimal=True)

    print(f"[✓] Saved JSON with base64 to {save_path}")


# ✅ FastAPI 및 외부 호출용 함수
CKPT_MAP = {
    "blouse": "models/kpt_blouse_020.ckpt",
    "trousers": "models/kpt_trousers_020.ckpt"
}

def predict_keypoints(image_path, category='blouse', output_json_path='output/output.json'):
    config = Config(category)
    setgpu(config.gpus)

    # ⛔️ 사전에 정의된 체크포인트 경로
    if category not in CKPT_MAP:
        raise ValueError(f"[❌] Unknown category: {category}")

    ckpt_path = CKPT_MAP[category]
    model = load_model(ckpt_path, config)

    input_tensor, image_np, filename = preprocess_image(image_path, config.img_max_size)

    resized_image_path = output_json_path.replace(".json", "_resized.jpg")
    Image.fromarray(image_np.astype(np.uint8)).save(resized_image_path)

    with torch.no_grad():
        _, heatmap = model(input_tensor)

    keypoints = get_keypoints_from_heatmap(heatmap)
    labels = config.keypoints[category]

    # trousers일 경우 mw 추가
    keypoints, labels = add_middle_waist(keypoints, labels, category)

    save_as_labelme_json(keypoints, labels, category, image_np, filename, output_json_path)

    return keypoints, labels  # 프론트에 리턴할 경우


# 🧪 CLI 테스트용 진입점
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--image', required=True, help='input image file')
    parser.add_argument('--clothes', default='blouse', help='one of: blouse, trousers, ...')
    parser.add_argument('--out_json', default='output.json', help='output json file')
    args = parser.parse_args()

    predict_keypoints(args.image, args.clothes, args.out_json)
