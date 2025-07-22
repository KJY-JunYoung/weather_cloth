const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require("express-async-handler");
const Cloth = require('../models/Cloth');
const Manequinn = require('../models/Mannequin');
const crypto = require("crypto");
const { sendResetEmail } = require("../utils/mailer");

//  회원가입 API
exports.register = asyncHandler(async (req, res) => {
    const { name, email, password, height, weight, gender } = req.body;
    console.log(req.body);
    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = new User({
      name,
      email,
      password: hashedPassword,
      height,
      weight,
      gender
    });

    await user.save();

    res.status(201).json({ message: '회원가입 성공' });
  }
);

//  로그인 API
exports.login = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;
    
    // 사용자 존재 여부 확인
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: '존재하지 않는 사용자입니다.' });
    }

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '비밀번호가 틀렸습니다.' });
    }

    // JWT 토큰 발급
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,             // 개발 중에는 false
      sameSite: 'Lax',           // ❗ 꼭 추가해야 함!
      maxAge: 1000 * 60 * 60 * 2
    });
    //  프로덕션(배포)에서는 꼭 true, 개발 중엔 false

    res.status(200).json({
      message: '로그인 성공',
      token,
      hasMannequin : user.hasMannequin  // 프론트에서 이걸 받고 false면 등록하시겠어요? -> 마네킹 등록 페이지로 이동(여기서 기본 마네킹 선택가능)
      // -> 싫다고하면 넘어감
    });
  }
);

exports.logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly:true,
    sameSite:"Lax",
    secure:false
  })

  res.status(200).json({message:"로그아웃 성공"});
  
})

// 내 정보 조회
exports.getMyInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

  res.status(200).json({ message: '사용자 정보 조회 성공', user });
});

// 내 정보 수정
exports.updateMyInfo = asyncHandler(async (req, res) => {
  const { name, height, gender, weight } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

  if (name) user.name = name;
  if (height) user.height = height;
  if (gender && ['남', '여'].includes(gender)) user.gender = gender;
  if (weight) user.weight = weight;

  await user.save();
  res.status(200).json({ message: '사용자 정보 수정 완료', user });
});

//  마이페이지: 유저 정보 + 옷 + 마네킹 조회
exports.getMyPage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  const clothes = await Cloth.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
  const mannequin = await Mannequin.findOne({ userId: req.user.id });

  res.status(200).json({
    message: '마이페이지 데이터 조회 완료',
    user,
    clothes,
    mannequin,
  });
});


// 이메일(아이디) 찾기 API (이름 기반)
exports.findEmail = asyncHandler(async (req, res) => {
  const { name } = req.body;

  // 이름으로 사용자 검색
  const user = await User.findOne({ name });

  if (!user) {
    return res.status(404).json({ message: "일치하는 사용자를 찾을 수 없습니다." });
  }

  res.status(200).json({
    message: "이메일 조회 성공",
    email: user.email,
  });
});


exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ message: "유효하지 않거나 만료된 토큰입니다." });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const userId = req.user.id; // JWT에서 추출
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }

  // 현재 비밀번호 확인
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "현재 비밀번호가 일치하지 않습니다." });
  }

  // 새 비밀번호 저장
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "유저가 없습니다." });
  }
  await Cloth.deleteMany({ userId: req.user.id });

  await User.deleteOne({ _id: req.user.id });

  res.json({ message: "계정이 삭제되었습니다." });

});

// controllers/authController.js


exports.requestResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "해당 이메일을 가진 사용자가 없습니다." });
  }

  // 1시간 유효한 랜덤 토큰 생성 (JWT 말고 UUID도 가능)
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 1000 * 60 * 60; // 1시간

  // 토큰 DB에 저장
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(expires);
  await user.save();

  console.log("📦 생성된 토큰:", token);
  console.log("🕐 expires:", new Date(expires));
  // 이메일 전송
  await sendResetEmail(user.email, token);

  res.status(200).json({ message: "비밀번호 재설정 이메일이 전송되었습니다." });
});

