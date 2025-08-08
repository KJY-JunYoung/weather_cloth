import joblib
import json
import numpy as np
import os

pkl_path = "output/test_single4/output.pkl"
output_json_path = "~/smplify-x/test/test_single4/keypoints/test4_keypoints.json"

output_json_path = os.path.expanduser(output_json_path)

data = joblib.load(pkl_path)
joints2d = np.array(data['joints2d'])[0]  # (17, 3)

# 25개 keypoints 배열 초기화 (0으로 채움)
keypoints_25 = np.zeros((25, 3))
# 앞의 17개는 PyMAF-X 값으로 채움
keypoints_25[:17] = joints2d

# Flatten
keypoints = []
for (x, y, conf) in keypoints_25:
    keypoints.extend([float(x), float(y), float(conf)])

coco_json = {
    "version": 1.2,
    "people": [{"pose_keypoints_2d": keypoints}]
}

os.makedirs(os.path.dirname(output_json_path), exist_ok=True)
with open(output_json_path, 'w') as f:
    json.dump(coco_json, f)

print(f"Saved padded COCO keypoints JSON to {output_json_path}")

