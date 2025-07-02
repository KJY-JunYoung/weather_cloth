// closet.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
