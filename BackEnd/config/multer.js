// config/multer.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 실제 저장 폴더 경로 (public 아래에 clothes 폴더)
    cb(null, path.join(__dirname, "..", "public", "images", "clothes"));
  },
  filename: (req, file, cb) => {
    // 파일명: 현재시간-원래이름 (중복 방지)
    console.log(file);
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;
