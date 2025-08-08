import os
import copy
import cv2
import time
import json
import torch
import joblib
import argparse
import numpy as np
from tqdm import tqdm
from torch.utils.data import DataLoader
import os.path as osp
from scipy.spatial import ConvexHull

from core.cfgs import cfg, parse_args
from models import pymaf_net
from core import path_config
from datasets.inference import Inference
from utils.demo_utils import convert_crop_cam_to_orig_img
from utils.geometry import convert_to_full_img_cam
from openpifpaf import decoder as ppdecoder
from openpifpaf import network as ppnetwork
from openpifpaf.predictor import Predictor
from PIL import Image, ExifTags


# =========================
# EXIF Orientation Fix
# =========================
def correct_orientation(image_path):
    img = Image.open(image_path)
    try:
        for orientation in ExifTags.TAGS.keys():
            if ExifTags.TAGS[orientation] == 'Orientation':
                break
        exif = img._getexif()
        if exif is not None:
            orientation_value = exif.get(orientation)
            if orientation_value == 3:
                img = img.rotate(180, expand=True)
            elif orientation_value == 6:
                img = img.rotate(270, expand=True)
            elif orientation_value == 8:
                img = img.rotate(90, expand=True)
    except (AttributeError, KeyError, IndexError):
        pass
    return img


# =========================
# Convex Hull 기반 측정 함수
# =========================
def measure_full_body_from_vertices(vertices):
    """
    vertices: (N, 3) numpy array [meters]
    return: dict with measurements in cm
    """
    verts = vertices.copy()

    # 1. 키 (Y축 높이)
    height_cm = (verts[:, 1].max() - verts[:, 1].min()) * 100

    # 2. 허리/가슴 y좌표 근사 (상체 비율로)
    waist_y = np.percentile(verts[:, 1], 45)   # 허리 근사
    chest_y = np.percentile(verts[:, 1], 70)   # 가슴 근사

    # 3. 특정 y 슬라이스 → 2D 평면 (XZ) Convex Hull 둘레
    def circumference_at_height(y_target):
        band = verts[np.abs(verts[:, 1] - y_target) < 0.01]
        if len(band) < 3:
            return 0.0
        points_2d = band[:, [0, 2]]
        hull = ConvexHull(points_2d)
        perimeter = 0.0
        for i in range(len(hull.vertices)):
            p1 = points_2d[hull.vertices[i]]
            p2 = points_2d[hull.vertices[(i + 1) % len(hull.vertices)]]
            perimeter += np.linalg.norm(p1 - p2)
        return perimeter * 100  # meters → cm

    waist_circum_cm = circumference_at_height(waist_y)
    chest_circum_cm = circumference_at_height(chest_y)

    # 4. 어깨 폭 (좌우 X축 extremum)
    shoulder_band = verts[np.abs(verts[:, 1] - chest_y) < 0.03]
    shoulder_width_cm = (shoulder_band[:, 0].max() - shoulder_band[:, 0].min()) * 100

    # 5. 팔 길이 / 다리 길이 (단순 bounding box 근사)
    # 팔 길이 = 전체 높이의 약 30% 근사 (정확 계산은 조인트 필요)
    arm_length_cm = height_cm * 0.3
    # 다리 길이 = 전체 높이의 약 55% 근사
    leg_length_cm = height_cm * 0.55

    return {
        "height_cm": height_cm,
        "shoulder_width_cm": shoulder_width_cm,
        "waist_circumference_cm": waist_circum_cm,
        "chest_circumference_cm": chest_circum_cm,
        "arm_length_cm": arm_length_cm,
        "leg_length_cm": leg_length_cm
    }


# =========================
# Demo 실행
# =========================
def run_demo(args):
    device = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')

    # ========= 이미지 폴더 전용 =========
    if args.image_folder is None:
        raise ValueError("Only --image_folder input is supported in this test version.")

    image_folder = args.image_folder
    num_frames = len(os.listdir(image_folder))
    img_shape = cv2.imread(osp.join(image_folder, os.listdir(image_folder)[0])).shape

    output_path = os.path.join(args.output_folder, osp.split(image_folder)[-1])
    os.makedirs(output_path, exist_ok=True)

    print(f'Input image number of frames {num_frames}')
    total_time = time.time()

    args.device = device
    args.pin_memory = True if torch.cuda.is_available() else False

    # ========= OpenPifPaf Detection =========
    pp_det_file_path = os.path.join(output_path, 'pp_det_results.pkl')
    pp_args = copy.deepcopy(args)
    pp_args.force_complete_pose = True
    ppdecoder.configure(pp_args)
    ppnetwork.Factory.configure(pp_args)
    ppnetwork.Factory.checkpoint = pp_args.detector_checkpoint
    Predictor.configure(pp_args)

    Predictor.batch_size = pp_args.detector_batch_size
    if pp_args.detector_batch_size > 1:
        Predictor.long_edge = 1000
    Predictor.loader_workers = 1
    predictor = Predictor()

    image_file_names = sorted([
        osp.join(image_folder, x)
        for x in os.listdir(image_folder)
        if x.endswith('.png') or x.endswith('.jpg')
    ])

    # EXIF 회전 보정
    for path in image_file_names:
        img = correct_orientation(path)
        img.save(path)

    # 보정된 이미지로 추론
    capture = predictor.images(image_file_names)

    tracking_results = {}
    print('Running openpifpaf for person detection...')
    for preds, _, meta in tqdm(capture, total=num_frames // args.detector_batch_size):
        if args.single_person:
            preds = [preds[0]]
        for pid, ann in enumerate(preds):
            if ann.score > args.detection_threshold:
                frame_i = meta['frame_i'] - 1 if 'frame_i' in meta else meta['dataset_index']
                file_name = meta['file_name'] if 'file_name' in meta else image_folder
                person_id = file_name.split('/')[-1].split('.')[0] + '_f' + str(frame_i) + '_p' + str(pid)
                det_wb_kps = ann.data
                det_face_kps = det_wb_kps[23:91]
                tracking_results[person_id] = {
                    'frames': [frame_i],
                    'joints2d': [det_wb_kps[:17]],
                    'joints2d_lhand': [det_wb_kps[91:112]],
                    'joints2d_rhand': [det_wb_kps[112:133]],
                    'joints2d_face': [np.concatenate([det_face_kps[17:], det_face_kps[:17]])],
                    'vis_face': [np.mean(det_face_kps[17:, -1])],
                    'vis_lhand': [np.mean(det_wb_kps[91:112, -1])],
                    'vis_rhand': [np.mean(det_wb_kps[112:133, -1])],
                }
    joblib.dump(tracking_results, open(pp_det_file_path, 'wb'))

    # ========= 모델 로드 =========
    model = pymaf_net(path_config.SMPL_MEAN_PARAMS, is_train=False).to(device)

    if args.pretrained_model is not None:
        print(f'Loading pretrained weights from \"{args.pretrained_model}\"')
        checkpoint = torch.load(args.pretrained_model)
        model.load_state_dict(checkpoint['model'], strict=True)
        print(f'Loaded checkpoint: {args.pretrained_model}')

    model.eval()

    # ========= Reconstruction =========
    person_id_list = list(tracking_results.keys())
    joints2d = []
    wb_kps = {'joints2d_lhand': [], 'joints2d_rhand': [], 'joints2d_face': [],
              'vis_face': [], 'vis_lhand': [], 'vis_rhand': []}
    frames = []

    for person_id in person_id_list:
        joints2d.extend(tracking_results[person_id]['joints2d'])
        wb_kps['joints2d_lhand'].extend(tracking_results[person_id]['joints2d_lhand'])
        wb_kps['joints2d_rhand'].extend(tracking_results[person_id]['joints2d_rhand'])
        wb_kps['joints2d_face'].extend(tracking_results[person_id]['joints2d_face'])
        wb_kps['vis_lhand'].extend(tracking_results[person_id]['vis_lhand'])
        wb_kps['vis_rhand'].extend(tracking_results[person_id]['vis_rhand'])
        wb_kps['vis_face'].extend(tracking_results[person_id]['vis_face'])
        frames.extend(tracking_results[person_id]['frames'])

    dataset = Inference(
        image_folder=image_folder,
        frames=frames,
        bboxes=[],
        joints2d=joints2d,
        scale=1.0,
        full_body=True,
        person_ids=person_id_list,
        wb_kps=wb_kps,
    )

    dataloader = DataLoader(dataset, batch_size=args.model_batch_size, num_workers=16)

    with torch.no_grad():
        pred_cam, pred_verts, pred_smplx_verts, pred_pose, pred_betas, pred_joints3d = [], [], [], [], [], []
        orig_height, orig_width = [], []
        person_ids = []
        smplx_params = []

        for batch in tqdm(dataloader):
            batch = {k: v.to(device) if isinstance(v, torch.Tensor) else v for k,v in batch.items()}
            person_ids.extend(batch['person_id'])
            orig_height.append(batch['orig_height'])
            orig_width.append(batch['orig_width'])

            preds_dict, _ = model(batch)
            output = preds_dict['mesh_out'][-1]

            pred_cam.append(output['theta'][:, :3])
            pred_verts.append(output['verts'])
            pred_smplx_verts.append(output['smplx_verts'])
            pred_pose.append(output['theta'][:, 13:85])
            pred_betas.append(output['theta'][:, 3:13])
            pred_joints3d.append(output['kp_3d'])

            smplx_params.append({
                'shape': output['pred_shape'],
                'body_pose': output['rotmat'],
                'left_hand_pose': output['pred_lhand_rotmat'],
                'right_hand_pose': output['pred_rhand_rotmat'],
                'jaw_pose': output['pred_face_rotmat'][:, 0:1],
                'leye_pose': output['pred_face_rotmat'][:, 1:2],
                'reye_pose': output['pred_face_rotmat'][:, 2:3],
                'expression': output['pred_exp'],
            })

        pred_cam = torch.cat(pred_cam, dim=0).cpu().numpy()
        pred_verts = torch.cat(pred_verts, dim=0).cpu().numpy()
        pred_smplx_verts = torch.cat(pred_smplx_verts, dim=0).cpu().numpy()
        pred_pose = torch.cat(pred_pose, dim=0).cpu().numpy()
        pred_betas = torch.cat(pred_betas, dim=0).cpu().numpy()
        pred_joints3d = torch.cat(pred_joints3d, dim=0).cpu().numpy()
        orig_height = torch.cat(orig_height, dim=0).cpu().numpy()
        orig_width = torch.cat(orig_width, dim=0).cpu().numpy()

    # ========= 카메라 보정 =========
    orig_cam = convert_crop_cam_to_orig_img(
        cam=pred_cam,
        bbox=dataset.bboxes,
        img_width=orig_width,
        img_height=orig_height
    )
    camera_translation = convert_to_full_img_cam(
        pare_cam=pred_cam,
        bbox_height=dataset.scales * 200.,
        bbox_center=dataset.bboxes[:, :2],
        img_w=orig_width,
        img_h=orig_height,
        focal_length=5000.,
    )

    # ========= 결과 저장 (pkl) =========
    pred_results = {
        'pred_cam': pred_cam,
        'orig_cam': orig_cam,
        'orig_cam_t': camera_translation,
        'verts': pred_verts,
        'smplx_verts': pred_smplx_verts,
        'pose': pred_pose,
        'betas': pred_betas,
        'joints3d': pred_joints3d,
        'joints2d': joints2d,
        'bboxes': dataset.bboxes,
        'frame_ids': frames,
        'person_ids': person_ids,
        'smplx_params': smplx_params,
    }
    joblib.dump(pred_results, os.path.join(output_path, "output.pkl"))
    print(f"Saved results to {os.path.join(output_path, 'output.pkl')}")

    # ========= Convex Hull 기반 측정 + JSON 저장 =========
    measurements = measure_full_body_from_vertices(pred_verts[0])  # 첫 번째 사람만 처리
    with open(os.path.join(output_path, "measurements.json"), "w") as f:
        json.dump(measurements, f, indent=4)
    print(f"Saved measurements to {os.path.join(output_path, 'measurements.json')}")


# =========================
# CLI
# =========================
class CustomFormatter(argparse.ArgumentDefaultsHelpFormatter,
                      argparse.RawDescriptionHelpFormatter):
    pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser(formatter_class=CustomFormatter)

    print('initializing openpifpaf')
    ppnetwork.Factory.cli(parser)
    ppdecoder.cli(parser)
    Predictor.cli(parser)

    parser.add_argument('--img_file', type=str, default=None,
                        help='Path to a single input image')
    parser.add_argument('--vid_file', type=str, default=None,
                        help='input video path or youtube link')
    parser.add_argument('--image_folder', type=str, default=None,
                        help='input image folder')
    parser.add_argument('--output_folder', type=str, default='output',
                        help='output folder to write results')
    parser.add_argument('--tracking_method', type=str, default='pose', choices=['bbox', 'pose'],
                        help='tracking method to calculate the tracklet of a subject from the input video')
    parser.add_argument('--detector_checkpoint', type=str, default='shufflenetv2k30-wholebody',
                        help='detector checkpoint for openpifpaf')
    parser.add_argument('--detector_batch_size', type=int, default=1,
                        help='batch size of person detection')
    parser.add_argument('--detection_threshold', type=float, default=0.55,
                        help='pifpaf detection score threshold.')
    parser.add_argument('--single_person', action='store_true',
                        help='only one person in the scene.')
    parser.add_argument('--cfg_file', type=str, default='configs/pymafx_config.yaml',
                        help='config file path.')
    parser.add_argument('--pretrained_model', default=None,
                        help='Path to network checkpoint')
    parser.add_argument('--pretrained_body', default=None, help='Load a pretrained checkpoint for body at the beginning training')
    parser.add_argument('--pretrained_hand', default=None, help='Load a pretrained checkpoint for hand at the beginning training')
    parser.add_argument('--pretrained_face', default=None, help='Load a pretrained checkpoint for face at the beginning training')

    parser.add_argument('--misc', default=None, type=str, nargs="*",
                        help='other parameters')
    parser.add_argument('--model_batch_size', type=int, default=8,
                        help='batch size for SMPL prediction')
    parser.add_argument('--display', action='store_true',
                        help='visualize the results of each step during demo')
    parser.add_argument('--no_render', action='store_true',
                        help='disable final rendering of output video.')
    parser.add_argument('--render_vis_ratio', type=float, default=1.,
                        help='transparency ratio for rendered results')
    parser.add_argument('--render_part', type=str, default='arm',
                        help='render part mesh')
    parser.add_argument('--render_model', type=str, default='smplx', choices=['smpl', 'smplx'],
                        help='render model type')
    parser.add_argument('--with_raw', action='store_true',
                        help='attach raw image.')
    parser.add_argument('--empty_bg', action='store_true',
                        help='render meshes on empty background.')
    parser.add_argument('--use_gt', action='store_true',
                        help='use the ground truth tracking annotations.')
    parser.add_argument('--anno_file', type=str, default='',
                        help='path to tracking annotation file.')
    parser.add_argument('--render_ratio', type=float, default=1.,
                        help='ratio for render resolution')
    parser.add_argument('--recon_result_file', type=str, default='',
                        help='path to reconstruction result file.')
    parser.add_argument('--pre_load_imgs', action='store_true',
                        help='pred-load input images.')
    parser.add_argument('--save_obj', action='store_true',
                        help='save results as .obj files.')

    args = parser.parse_args()
    parse_args(args)

    print('Running demo...')
    run_demo(args)

