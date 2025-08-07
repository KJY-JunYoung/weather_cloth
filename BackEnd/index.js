// index.js

require("dotenv").config(); // 환경변수 .env 읽기
const express = require("express");
const path = require("path");
const dbConnect = require("./config/dbConnect");
const errorHandler = require("./middlewares/errorHandler");
const clothRouter = require("./routes/clothRoutes");
const manequinnRouter = require("./routes/manequinnRoutes");
const authRouter = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const verifyToken = require("./middlewares/authMiddleware");
const cors = require("cors");

// Redis 연결 (필요 시)
const redis = require("./config/redis");

const app = express();

// CORS: 여러개 도메인이 필요하면 배열로! 환경변수에서 받아옴
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// JSON 및 쿠키 파서
app.use(express.json());
app.use(cookieParser());

// 라우터
app.use("/auth", authRouter);
app.use("/api/mannequin", verifyToken, manequinnRouter);
app.use("/api/cloth", verifyToken, clothRouter);

// 404 에러 처리
app.use((req, res, next) => {
  const error = new Error(`❗ 요청한 경로 ${req.originalUrl} 를 찾을 수 없습니다.`);
  error.status = 404;
  next(error);
});

// 에러 핸들러
app.use(errorHandler);

// DB 연결
dbConnect();

// 서버 실행
const PORT = process.env.PORT || 3000;
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: ${SERVER_URL}`);
});
