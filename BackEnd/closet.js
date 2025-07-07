// closet.js
const express = require('express');
const mongoose = require('mongoose');
const path = require("path");
const cookieParser = require('cookie-parser');
const cors = require("cors");
const env = require("dotenv");

// 환경 변수 불러오기
env.config();

// DB 연결 함수
const dbConnect = require('./config/dbConnect');

// 라우터 import
const authRouter = require("./routes/authRoutes");
const clothRouter = require("./routes/clothRoutes");
const manequinnRouter = require("./routes/manequinnRoutes");

// JWT 토큰 검증 미들웨어
const verifyToken = require("./middlewares/authMiddleware");

//에러 핸들러 미들웨어
const errorHandler = require("./middlewares/errorHandler");

//Express 앱 생성
const app = express();

// CORS 설정 (프론트엔드 도메인 허용)
app.use(cors({
  origin: "http://localhost:5173", // 오타: orgin → origin
  credentials: true                // 쿠키 포함 요청 허용
}));

// 정적 파일 경로 설정 (/public 경로 하위 파일 접근 가능)
app.use(express.static(path.join(__dirname, "public")));

//JSON 요청 파싱
app.use(express.json());

//쿠키 파서 (JWT를 쿠키로 주고받을 경우 사용)
app.use(cookieParser());

//라우터 등록
app.use("/auth", authRouter);                           // 회원가입, 로그인 등
app.use("/api/cloth", verifyToken, clothRouter);        // 옷 등록/조회
app.use("/api/manequinn", verifyToken, manequinnRouter); // 마네킹 생성/조회

//존재하지 않는 경로 처리 (404 핸들러)
app.use((req, res, next) => {
  const error = new Error(`❗ 요청한 경로 ${req.originalUrl} 를 찾을 수 없습니다.`);
  error.status = 404;
  next(error); // → errorHandler로 전달
});

//전역 에러 핸들러 등록
app.use(errorHandler);

//DB 연결 실행
dbConnect();

//서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});