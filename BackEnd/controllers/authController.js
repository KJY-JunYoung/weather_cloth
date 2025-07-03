const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//  회원가입 API
exports.register = async (req, res) => {
  try {
    const { email, password, height, weight, stylePreference } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = new User({
      email,
      password: hashedPassword,
      height,
      weight,
      stylePreference
    });

    await user.save();

    res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};

//  로그인 API
exports.login = async (req, res) => {
  try {
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
        httpOnly: true,       // JS로 접근 못 하게 → XSS 방어
        secure: false,        // HTTPS에서만 사용할 경우 true (개발 중엔 false)
        maxAge: 1000 * 60 * 60 * 2 // 2시간 유지
    });
    //  프로덕션(배포)에서는 꼭 true, 개발 중엔 false

    res.status(200).json({
      message: '로그인 성공',
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '서버 오류', error: err.message });
  }
};