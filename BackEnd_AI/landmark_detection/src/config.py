import math
import numpy as np

class Config:

    def __init__(self, clothes):
        # 경로 설정 (Colab 기준)
        self.proj_path = './'
        self.data_path = './data/'


        # 학습 하이퍼파라미터
        self.batch_size_per_gpu = 4        # A100이면 32~48도 가능
        self.workers = 4                    # Colab에서 안정적인 수준
        self.gpus = '0'                     # 단일 GPU (Colab은 무조건 1개)
        self.base_lr = 1e-3
        self.epochs = 20                    # 빠른 실험용 (최종 목적이면 50~100도 가능)

        self.clothes = clothes

        # 키포인트 정의 (옷 종류별)
        self.keypoints = {
            'blouse': ['neckline_left', 'neckline_right', 'center_front', 'shoulder_left', 'shoulder_right',
                       'armpit_left', 'armpit_right', 'cuff_left_in', 'cuff_left_out', 'cuff_right_in',
                       'cuff_right_out', 'top_hem_left', 'top_hem_right'],
            'outwear': ['neckline_left', 'neckline_right', 'shoulder_left', 'shoulder_right', 'armpit_left',
                        'armpit_right', 'waistline_left', 'waistline_right', 'cuff_left_in', 'cuff_left_out',
                        'cuff_right_in', 'cuff_right_out', 'top_hem_left', 'top_hem_right'],
            'trousers': ['waistband_left', 'waistband_right', 'crotch', 'bottom_left_in', 'bottom_left_out',
                         'bottom_right_in', 'bottom_right_out'],
            'skirt': ['waistband_left', 'waistband_right', 'hemline_left', 'hemline_right'],
            'dress': ['neckline_left', 'neckline_right', 'center_front', 'shoulder_left', 'shoulder_right',
                      'armpit_left', 'armpit_right', 'waistline_left', 'waistline_right', 'cuff_left_in',
                      'cuff_left_out', 'cuff_right_in', 'cuff_right_out', 'hemline_left', 'hemline_right']
        }

        keypoint = self.keypoints[self.clothes]
        self.num_keypoints = len(keypoint)

        # conjugate keypoints (좌우 대칭)
        self.conjug = []
        for i, key in enumerate(keypoint):
            if 'left' in key:
                j = keypoint.index(key.replace('left', 'right'))
                self.conjug.append([i, j])

        # 기준점
        if self.clothes in ['outwear', 'blouse', 'dress']:
            self.datum = [keypoint.index('armpit_left'), keypoint.index('armpit_right')]
        elif self.clothes in ['trousers', 'skirt']:
            self.datum = [keypoint.index('waistband_left'), keypoint.index('waistband_right')]

        # 이미지 관련
        self.img_max_size = 512      # 빠르게 하려면 256도 OK
        self.mu = 0.65
        self.sigma = 0.25

        # RPN 관련
        self.anchor_areas = [32 * 32., 64 * 64., 128 * 128., 256 * 256., 512 * 512.]
        self.aspect_ratios = [1 / 5., 1 / 2., 1 / 1., 2 / 1., 5 / 1.]
        self.scale_ratios = [1., pow(2, 1 / 3.), pow(2, 2 / 3.)]
        self.anchor_num = len(self.aspect_ratios) * len(self.scale_ratios)

        self.max_iou = 0.7
        self.min_iou = 0.4
        self.cls_thresh = 0.5
        self.nms_thresh = 0.5
        self.nms_topk = 1

        # Stage 2 heatmap 설정
        self.hm_stride = 4
        self.hm_sigma = self.img_max_size / self.hm_stride / 16.   # 가우시안 크기
        self.hm_alpha = 100.                                       # 중심 세기

        # learning rate schedule
        lrschedule = {
            'blouse': [10, 15],
            'outwear': [10, 15],
            'trousers': [10, 15],
            'skirt': [10, 15],
            'dress': [10, 15]
        }
        self.lrschedule = lrschedule[clothes]


if __name__ == '__main__':
    config = Config('blouse')
    print("Keypoints:", config.keypoints['blouse'])
    print("Conjugate pairs:", config.conjug)
