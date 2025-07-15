const express = require('express');
const router = express.Router();
const upload = require("../config/multer");           // 마네킹 이미지 업로드 설정
const { createMannequin } = require("../controllers/mannequinController");

// 3D 마네킹 생성 요청 (사진 최대 3장 업로드)
router.post('/make-3d', upload.array('images', 3), createMannequin);

module.exports = router;