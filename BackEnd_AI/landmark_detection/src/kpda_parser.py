import numpy as np
from sklearn.model_selection import train_test_split
import pandas as pd
import cv2

class KPDA():
    def __init__(self, config, data_dir, train_val):
        self.config = config

        if train_val == 'test':
            # 테스트셋을 사용할 경우, 테스트 전용 경로와 CSV 로딩
            data_dir += 'r2_test_b/'
            anno_df = pd.read_csv(data_dir + 'test.csv')
            anno_df['image_path'] = data_dir + anno_df['image_id']
        else:
            # 오직 wu_train 데이터만 사용
            data_folder_map = {
                'blouse': 'wu_train',
                'outwear': 'wu_train',
                'dress': 'wu_train',
                'skirt': 'wu_train_ver2',
                'trousers': 'wu_train_ver2'
            }
            data_dir0 = data_dir + data_folder_map[self.config.clothes] + '/'
            anno_df0 = pd.read_csv(data_dir0 + 'Annotations/annotations.csv')
            anno_df0['image_path'] = data_dir0 + anno_df0['image_id']

            # train/val split
            anno_df_train, anno_df_val = train_test_split(anno_df0, test_size=0.2, random_state=42)

            if train_val == 'train':
                anno_df = anno_df_train
            else:
                anno_df = anno_df_val

        # 특정 의류 종류 필터링
        self.anno_df = anno_df[anno_df['image_category'] == self.config.clothes]

    def size(self):
        return len(self.anno_df)

    def get_image_path(self, image_index):
        row = self.anno_df.iloc[image_index]
        return row['image_path']

    def get_bbox(self, image_index, extend=10):
        row = self.anno_df.iloc[image_index]
        locs = []
        for key, item in row.items():
            if key in self.config.keypoints[self.config.clothes]:
                loc = [int(x) for x in item.split('_')]
                if loc[0] != -1 and loc[1] != -1:
                    locs.append(loc[:2])
        locs = np.array(locs)
        minimums = np.amin(locs, axis=0)
        maximums = np.amax(locs, axis=0)
        bbox = np.array([[max(minimums[0]-extend, 0), max(minimums[1]-extend, 0),
                          maximums[0]+extend, maximums[1]+extend]], dtype=np.float32)
        return bbox

    def get_keypoints(self, image_index):
        row = self.anno_df.iloc[image_index]
        locs = []
        for key, item in row.items():
            if key in self.config.keypoints[self.config.clothes]:
                loc = [int(x) for x in item.split('_')]
                locs.append(loc)
        locs = np.array(locs)
        return locs


def get_default_xy(config, db_path):
    kpda = KPDA(config, db_path, 'train')
    s = []
    for k in range(kpda.size()):
        path = kpda.get_image_path(k)
        img = cv2.imread(path)
        h, w, _ = img.shape
        locs = kpda.get_keypoints(k).astype(np.float32)
        locs[:, 0] = locs[:, 0] / float(w)
        locs[:, 1] = locs[:, 1] / float(h)
        locs[:, 2] = (locs[:, 2] >= 0) * 1.0
        s.append(locs)
    s = np.stack(s)
    s = s.sum(axis=0)
    s = s[:, :2] / s[:, 2:].repeat(2, axis=1)
    print(s)


if __name__ == '__main__':
    from src.config import Config
    config = Config('blouse')
    kpda = KPDA(config, './data/', 'train')
    print(kpda.anno_df.head())
