// closet.js
const express = require('express');
const mongoose = require('mongoose');
const env = require("dotenv");
const path = require("path");
const dbConnect = require('./config/dbConnect');
// const callAIServer = require("./controllers/testFastApi")
const errorHandler = require("./middlewares/errorHandler")
const uploadRouter = require("./routes/uploadRoute")
const app = express();


app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use("/api", uploadRouter);
app.use(errorHandler);
// app.use()


dbConnect();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
