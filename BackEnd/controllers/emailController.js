const nodemailer = require("nodemailer");
const VerificationCode = require("../models/VerificationCode");

// 인증코드 이메일 전송
exports.sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6자리

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "비밀번호 재설정 인증코드",
      text: `인증코드: ${code}`,
    });

    await VerificationCode.create({ email, code });

    res.status(200).json({ message: "인증코드 전송 완료" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "이메일 전송 실패" });
  }
};

exports.verifyCode = async (req, res) => {
  const { email, code } = req.body;
  const record = await VerificationCode.findOne({ email, code });

  if (!record) {
    return res.status(400).json({ message: "인증코드가 일치하지 않습니다." });
  }

  // 필요하다면 이후 인증코드 삭제
  await VerificationCode.deleteOne({ email, code });
  res.status(200).json({ message: "인증 성공" });
};