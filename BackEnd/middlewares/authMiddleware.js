const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // ✅ 쿠키에서 토큰 꺼냄
  console.log("✅ 받은 쿠키:", req.cookies);
  console.log("✅ 추출한 token:", token);
  if (!token) {
    return res.status(401).json({ message: "인증 토큰 없음 (쿠키)" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // 인증 통과
  } catch (err) {
    res.status(401).json({ message: "유효하지 않은 토큰" });
  }
};

module.exports = verifyToken;