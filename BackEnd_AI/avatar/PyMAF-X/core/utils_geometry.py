import numpy as np
from scipy.spatial import ConvexHull

def compute_circumference(points_2d: np.ndarray) -> float:
    """2D 평면 점들의 Convex Hull 둘레 계산"""
    if len(points_2d) < 3:
        return 0.0
    hull = ConvexHull(points_2d)
    hull_points = points_2d[hull.vertices]
    perimeter = np.sum(np.linalg.norm(np.roll(hull_points, -1, axis=0) - hull_points, axis=1))
    return perimeter

def slice_circumference(vertices: np.ndarray, y_height: float, tol: float = 0.003) -> float:
    """XZ 평면에서 특정 y 높이 단면의 둘레 측정"""
    slice_band = vertices[np.abs(vertices[:, 1] - y_height) < tol]
    if len(slice_band) < 3:
        return 0.0
    points_2d = slice_band[:, [0, 2]]  # X-Z 평면
    return compute_circumference(points_2d) * 100  # cm

def slice_width_x(vertices: np.ndarray, y_height: float, tol: float = 0.01, z_threshold: float = 0.1) -> float:
    # 1. y 높이 기준 단면 슬라이스
    slice_band = vertices[np.abs(vertices[:, 1] - y_height) < tol]
    if len(slice_band) < 3:
        return 0.0

    # 2. z 기준 필터링 (등/가슴 중심 주변만 남김)
    z_center = np.mean(slice_band[:, 2])
    slice_band = slice_band[np.abs(slice_band[:, 2] - z_center) < z_threshold]
    if len(slice_band) < 3:
        return 0.0

    # 3. Convex Hull 계산 후 x 거리 측정
    points_2d = slice_band[:, [0, 2]]
    hull = ConvexHull(points_2d)
    hull_x = points_2d[hull.vertices][:, 0]
    return (hull_x.max() - hull_x.min()) * 100  # cm

def slice_width_convex_x(vertices: np.ndarray, y_height: float, tol: float = 0.01) -> float:
    """
    Convex Hull 상에서 가장 멀리 떨어진 두 점 간 거리로 어깨 너비 측정 (2D XZ 평면)
    """
    slice_band = vertices[np.abs(vertices[:, 1] - y_height) < tol]
    if len(slice_band) < 3:
        return 0.0

    points_2d = slice_band[:, [0, 2]]
    hull = ConvexHull(points_2d)
    hull_points = points_2d[hull.vertices]

    max_dist = 0.0
    for i in range(len(hull_points)):
        for j in range(i + 1, len(hull_points)):
            dist = np.linalg.norm(hull_points[i] - hull_points[j])
            if dist > max_dist:
                max_dist = dist

    return max_dist * 100  # cm
