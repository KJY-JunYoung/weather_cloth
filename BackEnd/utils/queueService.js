// ✅ bullmqWorkers.js
const { Queue, Worker } = require('bullmq');
console.log("QueueScheduler 타입:", typeof QueueScheduler);
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Cloth = require("../models/Cloth");
const Mannequin = require("../models/Mannequin");
const User = require("../models/User");

const redisConnection = { host: 'localhost', port: 6379 };

// ========================
// 🧍‍♂️ 마네킹 큐 + 워커
// ========================
const mannequinGenerationQueue = new Queue('mannequinGenerationQueue', { connection: redisConnection });


const mannequinGenerationWorker = new Worker("mannequinGenerationQueue", async job => {
  const { userId, imagePath, fileName } = job.data;

  try {
    if (!fs.existsSync(imagePath)) throw new Error(`이미지 파일 없음: ${imagePath}`);

    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));

    const response = await axios.post("http://localhost:8000/mannequin", form, {
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
}, { connection: redisConnection });

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


const clothProcessingWorker = new Worker("clothProcessingQueue", async job => {
  const { imagePath, userId, name, description, style, category, subCategory, size, color, fileName } = job.data;

  try {
    if (!fs.existsSync(imagePath)) throw new Error(`이미지 파일 없음: ${imagePath}`);

    const form = new FormData();
    form.append("image", fs.createReadStream(imagePath));
    form.append("cloth_id", job.id);

    const response = await axios.post("http://localhost:8000/cloth-model", form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    const { modelUrl } = response.data;

    await Cloth.create({
      userId,
      imageUrl: `/images/clothes/${fileName}`,
      modelUrl,
      name,
      description,
      style,
      category,
      subCategory,
      size,
      color,
    });

    console.log(`✅ Cloth 저장 완료 (userId: ${userId}, name: ${name})`);
    return { status: "success" };

  } catch (err) {
    console.error(`❌ Cloth 작업 실패 (job ${job.id}):`, err.message);
    throw err;
  }
}, { connection: redisConnection, concurrency: 3 });

clothProcessingWorker.on('completed', job => {
  console.log(`🎉 옷 job ${job.id} 완료:`, job.returnvalue);
});
clothProcessingWorker.on('failed', (job, err) => {
  console.error(`💥 옷 job ${job.id} 실패:`, err.message);
});

module.exports = { mannequinGenerationQueue, clothProcessingQueue };