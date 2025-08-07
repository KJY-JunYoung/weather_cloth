const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const asyncHandler = require("express-async-handler");
const Cloth = require("../models/Cloth");
const { clothProcessingQueue } = require("../utils/queueService");

const VALID_CATEGORIES = ["top", "bottom"];
const VALID_SUB_CATEGORIES = ["T-shirt", "Shirt", "Hoodie", "Sweatshirt", "Skirt", "Pants", "Shorts"];

const validateCategory = (category) => VALID_CATEGORIES.includes(category);
const validateSubCategory = (subCategory) => VALID_SUB_CATEGORIES.includes(subCategory);

// ✅ 옷 등록
const uploadCloth = asyncHandler(async (req, res) => {
  const files = req.files || {};
  const front = files["cloth_front"]?.[0];
  const back = files["cloth_back"]?.[0];
  const { subCategory, description, category } = req.body;
  const userId = req.user.id;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const defaultName = `${category || "cloth"}_${today}`;
  const name = req.body.name || defaultName;

  if (!front || !back) return res.status(400).json({ error: "앞면과 뒷면 이미지 모두 필요합니다." });
  if (!validateCategory(category)) return res.status(400).json({ error: "카테고리 오류" });
  if (!validateSubCategory(subCategory)) return res.status(400).json({ error: "서브 카테고리 오류" });

  const clothId = new mongoose.Types.ObjectId().toString();
  const dataDir = path.join(__dirname, "..", "data", `user_${userId}`, "clothes", clothId);
  fs.mkdirSync(dataDir, { recursive: true });

  const fileNameFront = `${Date.now()}-front${path.extname(front.originalname)}`;
  const fileNameBack = `${Date.now()}-back${path.extname(back.originalname)}`;
  const dataImagePathFront = path.join(dataDir, fileNameFront);
  const dataImagePathBack = path.join(dataDir, fileNameBack);
  fs.renameSync(front.path, dataImagePathFront);
  fs.renameSync(back.path, dataImagePathBack);

  // public 이미지도 복사
  const publicDir = path.join(__dirname, "..", "public", "images", "clothes");
  fs.mkdirSync(publicDir, { recursive: true });
  fs.copyFileSync(dataImagePathFront, path.join(publicDir, fileNameFront));
  fs.copyFileSync(dataImagePathBack, path.join(publicDir, fileNameBack));

  const job = await clothProcessingQueue.add("processClothImage", {
    frontPath: dataImagePathFront,
    backPath: dataImagePathBack,
    userId,
    name,
    description,
    category,
    subCategory,
    fileNameFront,
    fileNameBack,
    clothId,
  });

  res.status(202).json({
    message: "AI 모델링 큐 등록 완료",
    jobId: job.id,
    clothId,
  });
});

// ✅ 옷 수정
const modifyCloth = asyncHandler(async (req, res) => {
  const clothId = req.params.id;
  const { subCategory, category, size, style, name, description, color } = req.body;

  const cloth = await Cloth.findOne({ _id: clothId, userId: req.user.id });
  if (!cloth) return res.status(404).json({ error: "옷을 찾을 수 없습니다." });

  if (category && validateCategory(category)) cloth.category = category;
  if (subCategory && validateSubCategory(subCategory)) cloth.subCategory = subCategory;
  if (name !== undefined) cloth.name = name;
  if (description !== undefined) cloth.description = description;

  // if (color) {
  //   cloth.color = Array.isArray(color)
  //     ? color
  //     : typeof color === "string"
  //     ? color.split(",").map(c => c.trim())
  //     : [];
  // }

  await cloth.save();
  res.json({ message: "옷 정보 수정 완료", data: cloth });
});

// 작업 상태 조회
const getClothStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!jobId) return res.status(400).json({ error: "jobId가 없습니다." });

  try {
    const job = await clothProcessingQueue.getJob(jobId);
    if (!job) return res.status(404).json({ status: "not_found" });

    const status = await job.getState();

    if (status === "completed") {
      return res.json({
        status: "completed",
        result: job.returnvalue,
      });
    }

    if (status === "failed") {
      return res.json({
        status: "failed",
        error: job.failedReason,
      });
    }

    return res.json({ status });
  } catch (err) {
    console.error("옷 상태 조회 실패:", err.message);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 옷 전체 조회
const getClothes = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  try {
    const clothes = await Cloth.find({ userId }).sort({ uploadedAt: -1 });
    res.json({ data: clothes });
  } catch (err) {
    console.error("옷 조회 실패:", err.message);
    res.status(500).json({ error: "서버 오류로 옷 조회 실패" });
  }
});

// ✅ 옷 삭제
const deleteClothes = asyncHandler(async (req, res) => {
  const clothId = req.params.id;
  const userId = req.user.id;

  const cloth = await Cloth.findOne({ _id: clothId, userId });

  if (!cloth) {
    return res.status(404).json({ error: "옷을 찾을 수 없습니다." });
  }

  // DB에서 삭제
  await cloth.deleteOne();

  // 👉 파일 삭제 (선택적 기능: 주석 해제하면 실제 이미지도 지움)
  try {
    const basePath = path.join(__dirname, "..");
    const frontPath = path.join(basePath, cloth.imageUrlFront || "");
    const backPath = path.join(basePath, cloth.imageUrlBack || "");
    const dataDir = path.join(basePath, "data", `user_${userId}`, "clothes", clothId);

    if (fs.existsSync(frontPath)) fs.unlinkSync(frontPath);
    if (fs.existsSync(backPath)) fs.unlinkSync(backPath);
    if (fs.existsSync(dataDir)) fs.rmSync(dataDir, { recursive: true });

  } catch (err) {
    console.warn("이미지 파일 삭제 중 오류 (무시):", err.message);
  }

  res.json({ message: "옷 삭제 완료", clothId });
});


module.exports = {
  uploadCloth,
  modifyCloth,
  getClothStatus,
  getClothes, 
  deleteClothes
};
