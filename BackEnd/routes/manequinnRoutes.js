const express = require('express');
const router = express.Router();
const upload = require("../config/multer");           // 마네킹 이미지 업로드 설정
const verifyToken = require("../middlewares/authMiddleware"); // JWT 인증
const { make3DModel } = require("../controllers/manequinnController");

// 3D 마네킹 생성 요청 (사진 최대 3장 업로드)
router.post('/make-3d', verifyToken, upload.array('images', 3), make3DModel);

module.exports = router;