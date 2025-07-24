const Cloth = require("../models/Cloth");
const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const { clothProcessingQueue } = require("../utils/queueService");

const uploadCloth = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일이 없습니다." });

  const { subCategory, name, description, style, category, size } = req.body;

  if (!["top", "bottom"].includes(category)) return res.status(400).json({ error: "카테고리 오류" });
  if (!["T-shirt", "Shirt", "Hoodie", "Sweatshirt", "Skirt", "Pants", "Shorts"].includes(subCategory)) return res.status(400).json({ error: "서브 카테고리 오류" });
  if (!["XS", "S", "M", "L", "XL", "2XL"].includes(size)) return res.status(400).json({ error: "사이즈 오류" });

  let color = [];
  if (typeof req.body.color === "string") {
    color = req.body.color.split(",").map(c => c.trim());
  }

  const filePath = path.join(__dirname, "..", "public", "images", "clothes", req.file.filename);
  if (!fs.existsSync(filePath)) return res.status(500).json({ error: "파일 저장 실패" });

  await clothProcessingQueue.add("processClothImage", {
    imagePath: filePath,
    userId: req.user.id,
    name,
    description,
    style,
    category,
    subCategory,
    size,
    color,
    fileName: req.file.filename,
  });

  res.status(202).json({ message: "AI 모델링 큐에 등록 완료." });
});

const getClothes = asyncHandler(async (req, res) => {
  const { category, size, color, name } = req.query;
  const filter = { userId: req.user.id };

  if (category) filter.category = category;
  if (color) filter.color = color;
  if (name) filter.name = name;
  if (size) filter.size = size;

  const clothes = await Cloth.find(filter).sort({ createdAt: -1 });
  res.json(clothes);
});

const deleteClothes = asyncHandler(async (req, res) => {
  const clothId = req.params.id;
  if (!clothId) return res.status(400).json({ error: "삭제할 ID가 없습니다." });

  const cloth = await Cloth.findOne({ _id: clothId, userId: req.user.id });
  if (!cloth) return res.status(404).json({ error: "해당 옷을 찾을 수 없습니다." });

  if (cloth.imageUrl) {
    const imagePath = path.join(__dirname, "..", "public", cloth.imageUrl);
    try {
      await fs.promises.unlink(imagePath);
    } catch (err) {
      console.error("파일 삭제 실패:", err.message);
    }
  }

  await Cloth.deleteOne({ _id: clothId });
  res.json({ message: "삭제 완료" });
});

const modifyCloth = asyncHandler(async (req, res) => {
  const clothId = req.params.id;
  const { subCategory, category, size, style, name, description, color } = req.body;

  const cloth = await Cloth.findOne({ _id: clothId, userId: req.user.id });
  if (!cloth) return res.status(404).json({ error: "옷을 찾을 수 없습니다." });

  if (category && ["top", "bottom"].includes(category)) cloth.category = category;
  if (subCategory && ["T-shirt", "Shirt", "Hoodie", "Sweatshirt", "Skirt", "Pants", "Shorts"].includes(subCategory)) cloth.subCategory = subCategory;
  if (size && ["XS", "S", "M", "L", "XL", "2XL"].includes(size)) cloth.size = size;
  if (style && ["casual", "formal", "sporty", "street", "other"].includes(style)) cloth.style = style;
  if (name !== undefined) cloth.name = name;
  if (description !== undefined) cloth.description = description;

  if (color) {
    if (Array.isArray(color)) cloth.color = color;
    else if (typeof color === "string") cloth.color = color.split(",").map(c => c.trim());
  }

  await cloth.save();
  res.json({ message: "옷 정보 수정 완료", data: cloth });
});

module.exports = { uploadCloth, getClothes, deleteClothes, modifyCloth };
