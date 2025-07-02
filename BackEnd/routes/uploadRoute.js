const multer = require("multer");
const express = require("express");
const router = express.Router();
const upload = require("../config/multer");

router
.post("/upload-cloth", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "파일이 없습니다." });
  }

  const fileUrl = `http://localhost:3000/uploads/clothes/${req.file.filename}`;

  res.json({
    message: "업로드 성공!",
    fileUrl,
  });
});

module.exports = router;