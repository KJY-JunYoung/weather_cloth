// 외부 패키지 및 모듈 불러오기
const axios = require("axios");               
const FormData = require("form-data");       
const fs = require("fs");                   
const path = require("path");                

const Manequinn = require("../models/Manequinn"); 
const User = require("../models/User");           

exports.createMannequin = async (req, res, next) => {
  try {
    const userId = req.userId;  
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
    const response = await axios.post("http://localhost:8000/make-3d", formData, {
      headers: formData.getHeaders(),        
      maxBodyLength: Infinity,               
    });

    const { model3DUrl } = response.data; 
  
    // MongoDB에 마네킹 정보 저장
    const mannequin = new Manequinn({
      userId,
      modelUrl: model3DUrl,
    });
    await mannequin.save();

    // 해당 유저 문서에도 마네킹 생성 여부 및 URL 업데이트
    await User.findByIdAndUpdate(userId, {
      hasMannequin: true,
      mannequinModelUrl: model3DUrl,
    });

    // 클라이언트에게 성공 응답 반환
    res.status(201).json({
      message: "3D 마네킹 생성 완료",
      modelUrl: model3DUrl,
    });
  } catch (err) {
    console.error("마네킹 생성 중 오류:", err.message);
    next(err);
  }
};