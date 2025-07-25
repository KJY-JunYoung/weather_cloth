const axios = require("axios");

async function callAIServer() {
  try {
    const response = await axios.post("http://15.164.220.164:5000/make-3d", {
      imageUrl: "http://15.164.220.164/uploads/front123.jpg"
    });

    console.log("✅ AI 서버 응답:", response.data);
  } catch (error) {
    console.error("❌ AI 서버 요청 실패:", error.message);
  }
}

module.exports = callAIServer;