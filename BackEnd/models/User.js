const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required:true},
  password: { type: String, required: true },
  height: { type: Number, required: true },
  weight: { type: Number, required: true },
  gender: {
    type: String,
    enum: ['남', '여'],
    required: true
  },

  hasMannequin: {
    type: Boolean,
    default: false
  },
  mannequinModelUrl: {
    type: String,
    required: false  // 최초 로그인 후 아직 생성 전일 수 있음
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);