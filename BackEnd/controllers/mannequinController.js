// 외부 패키지 및 모듈 불러오기
const axios = require("axios");               
const FormData = require("form-data");       
const fs = require("fs");                   
const path = require("path");                
const asyncHandler = require("express-async-handler")

const Manequinn = require("../models/Mannequin"); 
const User = require("../models/User");           

exports.createMannequin = async (req, res, next) => {
  try {
    const userId = req.user.id;  
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "이미지를 업로드해주세요." });
    }

    const filePath = path.join(__dirname, "..", "public", "images", "mannequins", file.filename);
    const stream = fs.createReadStream(filePath); 

    const formData = new FormData();
    formData.append("images", stream, file.originalname);

    const response = await axios.post("http://localhost:8000/mannequin", formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
    });

    const { modelUrl } = response.data;

    await new Manequinn({ userId, modelUrl }).save();
    await User.findByIdAndUpdate(userId, {
      hasMannequin: true,
      mannequinModelUrl: modelUrl,
      imageURL: `/images/mannequins/${file.filename}`  // ✅ 경로 저장
    });

    res.status(201).json({
      message: "3D 마네킹 생성 완료",
      modelUrl,
    });
  } catch (err) {
    console.error("마네킹 생성 중 오류:", err.message);
    next(err);
  }
};



exports.deleteMannequin = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });

  if (!user.hasMannequin) {
    return res.status(400).json({ message: "이미 마네킹이 없습니다." });
  }

  // 🧹 업로드한 사진 삭제
  if (user.imageURL) {
    const imagePath = path.join(__dirname, "..", "public", user.imageURL);
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);  // 파일 삭제
        console.log("사진 삭제됨:", imagePath);
      }
    } catch (err) {
      console.error("사진 삭제 실패:", err.message);
      // 사진 삭제 실패는 치명적인 오류 아님 → 계속 진행
    }
    user.imageURL = null; // DB에서도 비워주기
  }

  user.hasMannequin = false;
  user.mannequinModelUrl = null;
  await user.save();

  res.status(200).json({ message: "마네킹 및 사진 정보가 삭제되었습니다." });
});

