// config/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 저장 폴더 설정
const uploadDir = path.join(__dirname, "..", "public", "images", "clothes");

// 디렉토리 생성 (없으면 자동 생성)
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 저장 방식 지정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

// 허용 확장자 검사 (이미지 파일만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const isValid = allowedTypes.test(ext);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("이미지 파일만 업로드 가능합니다. (jpg, jpeg, png, webp)"), false);
  }
};

// multer 설정: 최대 20MB 파일 허용
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 최대 20MB
  }
});

module.exports = upload;