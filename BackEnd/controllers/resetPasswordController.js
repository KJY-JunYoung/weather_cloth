const User = require("../models/User");
const bcrypt = require("bcrypt");

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