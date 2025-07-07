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