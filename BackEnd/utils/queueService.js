const { Queue, Worker } = require('bullmq');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Cloth = require("../models/Cloth");
const Mannequin = require("../models/Mannequin");
const User = require("../models/User");
const IORedis = require('ioredis');
require('dotenv').config();

// ✅ .env에서 Redis URL 불러오기
const redisConnection = new IORedis(process.env.REDIS_URL || "redis://redis:6379", {
  maxRetriesPerRequest: null,  // ✅ 필수!
});
console.log("👉 Redis 연결 주소:", process.env.REDIS_URL);
// ========================
// 🧍‍♂️ 마네킹 큐 + 워커
// ========================
const mannequinGenerationQueue = new Queue('mannequinGenerationQueue', { connection: redisConnection });

const mannequinGenerationWorker = new Worker(
  'mannequinGenerationQueue',
  async job => {
    const { userId, imagePath, fileName } = job.data;

    try {
      if (!fs.existsSync(imagePath)) throw new Error(`이미지 파일 없음: ${imagePath}`);

      const form = new FormData();
      form.append("image", fs.createReadStream(imagePath));

      const response = await axios.post("http://15.165.159.112:8000/mannequin", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });

      const { modelUrl } = response.data;

      await Mannequin.create({ userId, modelUrl });

      await User.findByIdAndUpdate(userId, {
        hasMannequin: true,
        mannequinModelUrl: modelUrl,
        imageURL: `/images/mannequins/${fileName}`,
      });

      console.log(`✅ 마네킹 생성 완료 (userId: ${userId})`);
      return { status: "success", modelUrl };

    } catch (err) {
      console.error(`❌ 마네킹 생성 실패 (job ${job.id}):`, err.message);
      throw err;
    }
  },
  { connection: redisConnection }
);

mannequinGenerationWorker.on('completed', job => {
  console.log(`🎉 마네킹 job ${job.id} 완료:`, job.returnvalue);
});
mannequinGenerationWorker.on('failed', (job, err) => {
  console.error(`💥 마네킹 job ${job.id} 실패:`, err.message);
});

// ========================
// 👕 옷 큐 + 워커
// ========================
const clothProcessingQueue = new Queue('clothProcessingQueue', { connection: redisConnection });

const clothProcessingWorker = new Worker(
  'clothProcessingQueue',
  async job => {
    const {
      frontPath,
      backPath,
      userId,
      name,
      description,
      // style,
      category,
      subCategory,
      // size,
      // color,
      fileNameFront,
      fileNameBack,
      clothId,
    } = job.data;

    try {
      if (!fs.existsSync(frontPath) || !fs.existsSync(backPath)) {
        throw new Error("앞면 또는 뒷면 이미지가 존재하지 않습니다.");
      }

      const form = new FormData();
      form.append("cloth_front", fs.createReadStream(frontPath));
      form.append("cloth_back", fs.createReadStream(backPath));
      form.append("cloth_id", clothId);  // 🆔 고유 ID 넘기기 (옵션)
      form.append("category", category);
      form.append("subCategory", subCategory);

      const response = await axios.post("http://15.165.159.112:8000/cloth-model", form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
      });

      const { modelUrl } = response.data;

      await Cloth.create({
        _id: clothId,
        userId,
        name,
        description,
        category,
        subCategory,
        imageUrlFront: `/images/clothes/${fileNameFront}`,
        imageUrlBack: `/images/clothes/${fileNameBack}`,
        modelUrl,
      });
      console.log(`✅ Cloth 저장 완료 (userId: ${userId}, name: ${name})`);
      return { status: "success", modelUrl };

    } catch (err) {
      console.error(`❌ Cloth 작업 실패 (job ${job.id}):`, err.message);
      throw err;
    }
  },
  { connection: redisConnection, concurrency: 3 }
);

module.exports = { mannequinGenerationQueue, clothProcessingQueue };
