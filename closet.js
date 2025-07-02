// closet.js
const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/digital-closet', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB 연결 성공'))
  .catch((err) => console.error('❌ MongoDB 연결 실패:', err));

app.get('/', (req, res) => {
  res.send('디지털 옷장 백엔드 동작 중!');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
