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
    const files = req.files;     
    
    // 이미지 유효성 검사
    if (!files) {
      return res.status(400).json({ message: "이미지를 업로드해주세요." });
    }
    if (files.length < 1) {
      return res.status(400).json({ message: "최소 1장의 이미지를 업로드해야 합니다." });
    }
    if (files.length > 3) {
      return res.status(400).json({ message: "최대 3장까지만 업로드할 수 있습니다." });
    }


    const formData = new FormData();
    files.forEach((file) => {
      const filePath = path.join(__dirname, "..", "public", "images", "clothes", file.filename);
      const stream = fs.createReadStream(filePath); 
      formData.append("images", stream, file.originalname); 
    });

    // FastAPI 서버에 POST 요청 전송
    const response = await axios.post("http://localhost:8000/mannequin", formData, {
      headers: formData.getHeaders(),        
      maxBodyLength: Infinity,               
    });

    const { modelUrl } = response.data; 
  
    // MongoDB에 마네킹 정보 저장
    const mannequin = new Manequinn({
      userId,
      modelUrl: modelUrl,
    });
    await mannequin.save();

    // 해당 유저 문서에도 마네킹 생성 여부 및 URL 업데이트
    await User.findByIdAndUpdate(userId, {
      hasMannequin: true,
      mannequinModelUrl: modelUrl,
    });

    // 클라이언트에게 성공 응답 반환
    res.status(201).json({
      message: "3D 마네킹 생성 완료",
      modelUrl: modelUrl,
    });
  } catch (err) {
    console.error("마네킹 생성 중 오류:", err.message);
    next(err);
  }
};

exports.deleteMannequin = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: "유저 ID가 없습니다." });
  }

  const user = await User.findOne({ _id: userId });

  if (!user) {
    return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
  }
  
  if (!user.hasMannequin) {
    return res.status(400).json({ message: "이미 마네킹이 없습니다." });
  }

  user.hasMannequin = false;
  await user.save();

  return res.status(200).json({ message: "마네킹 정보가 삭제되었습니다." });
});
