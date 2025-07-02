// closet.js
const express = require('express');
const mongoose = require('mongoose');
const env = require("dotenv");
const path = require("path");
const dbConnect = require('./config/dbConnect');
const app = express();

app.use(express.json());
// app.use()

dbConnect();

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
