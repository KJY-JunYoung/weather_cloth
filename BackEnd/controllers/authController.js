const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require("express-async-handler");

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
      token
    });
  }
);

// 로그아웃 API (쿠키 제거)
exports.logout = (req, res) => {
  res.clearCookie("token"); // 클라이언트에서 쿠키 제거
  res.status(200).json({ message: "로그아웃 완료" });
};


// 내 정보 조회
exports.getMyInfo = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

  res.status(200).json({ message: '사용자 정보 조회 성공', user });
});

// 내 정보 수정
exports.updateMyInfo = asyncHandler(async (req, res) => {
  const { name, height, gender } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });

  if (name) user.name = name;
  if (height) user.height = height;
  if (gender && ['남', '여'].includes(gender)) user.gender = gender;

  await user.save();
  res.status(200).json({ message: '사용자 정보 수정 완료', user });
});

//  마이페이지: 유저 정보 + 옷 + 마네킹 조회
exports.getMyPage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  const clothes = await Cloth.find({ userId: req.user.id }).sort({ uploadedAt: -1 });
  const mannequin = await Manequinn.findOne({ userId: req.user.id });

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


// 비밀번호 재설정 (Reset Password)
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  // 사용자 존재 여부 확인
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "등록된 이메일이 없습니다." });
  }

  // 새 비밀번호 암호화
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  await user.save();

  res.status(200).json({ message: "비밀번호가 성공적으로 재설정되었습니다." });
});