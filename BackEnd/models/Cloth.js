const mongoose = require("mongoose");

const clothesSchema = new mongoose.Schema({
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
    },

  imageUrl: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ["top", "bottom"], // 상의/하의 구분
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  // 나중에 userId 같은 필드 추가 가능
});

module.exports = mongoose.model("Cloth", clothesSchema);