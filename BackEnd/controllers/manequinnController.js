const { generate3DModel } = require('../ai/mannequin');
const Manequinn = require('../models/Manequinn');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');


// @desc 사진 1~3장 업로드 후 AI 분석하여 3D 마네킹 생성
// @route POST /api/manequinn/make-3d
// @access Private (JWT 인증 필요)
 
 
exports.make3DModel = asyncHandler(async (req, res) => {

// 업로드 유효성 검사
const files = req.files;

// 파일이 아예 없는 경우
if (!files) {
  return res.status(400).json({ message: '이미지를 업로드해주세요.' });
}

// 파일이 1장보다 적은 경우
if (files.length < 1) {
  return res.status(400).json({ message: '최소 1장의 이미지를 업로드해야 합니다.' });
}

// 파일이 3장을 초과한 경우
if (files.length > 3) {
  return res.status(400).json({ message: '최대 3장까지만 업로드할 수 있습니다.' });
}

  // 파일 경로 배열 추출
  const imagePaths = files.map(file => file.path);

  // AI 분석 + 3D 모델 생성
  const modelUrl = await generate3DModel(imagePaths);

  // 생성된 마네킹 모델 MongoDB 저장
  const manequinn = await Manequinn.create({
    userId: req.user.id,
    modelUrl
  });

  // 사용자 정보에 마네킹 생성 여부와 URL 업데이트
  await User.findByIdAndUpdate(req.user.id, {
    hasMannequin: true,
    mannequinModelUrl: modelUrl
  });

  // 클라이언트에 결과 응답
  res.status(200).json({
    status: 'success',
    model3DUrl: modelUrl,
    manequinnId: manequinn._id
  });
});