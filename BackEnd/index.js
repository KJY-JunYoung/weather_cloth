// closet.js
const express = require('express');
const mongoose = require('mongoose');
const env = require("dotenv");
const path = require("path");
const dbConnect = require('./config/dbConnect');
// const callAIServer = require("./controllers/testFastApi")
const errorHandler = require("./middlewares/errorHandler");
const clothRouter = require("./routes/clothRoutes");
const manequinnRouter = require("./routes/manequinnRoutes");
const authRouter = require("./routes/authRoutes");
const cookieParser = require('cookie-parser');
const verifyToken = require("./middlewares/authMiddleware");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "http://15.164.220.164:5173",
  credentials: true
}))
// cors 설정

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cookieParser());
app.use("/auth", authRouter);
app.use("/api/mannequin", verifyToken, manequinnRouter);
app.use("/api/cloth", verifyToken, clothRouter);
app.use((req, res, next) => {
  const error = new Error(`❗ 요청한 경로 ${req.originalUrl} 를 찾을 수 없습니다.`);
  error.status = 404;
  next(error); // 👉 errorHandler로 전달됨
});

app.use(errorHandler);
// app.use()


dbConnect();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://15.164.220.164:${PORT}`);
});
