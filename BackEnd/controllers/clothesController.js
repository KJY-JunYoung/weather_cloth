const Cloth = require("../models/Cloth");
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");

const uploadCloth = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 없습니다." });
    }

    const { userId, name, description, style, category, size } = req.body;  // 무조건 옷사이즈가 req 요청 객체에 있어야함 프론트에서 신경쓸 것

    if (!["top", "bottom"].includes(category)) {
      return res.status(400).json({ error: "카테고리는 top 또는 bottom만 가능합니다." });
    }

    if(!["XS", "S", "M", "L", "XL", "2XL"].includes(size)) {
      return res.status(400).json({ error: "사이즈를 선택해주세요." });
    }

    const imageUrl = `/images/clothes/${req.file.filename}`;
    // userId, name, description, style, imageUrl, category, modelUrl,size, color, 

    let color = req.body.color;

    if (typeof color === "string") {
      color = color.split(",").map(c => c.trim());  // "white, red" → ["white", "red"]
    }

    const formData = new FormData();
    formData.append("image", fs.createReadStream(path.join(__dirname, "..", "public", "images", "clothes", req.file.filename)));

    const response = await axios.post("http://localhost:8000/make-3d-cloth", formData, {
      headers: formData.getHeaders()
    });
    
    const { status, modelUrl } = response.data;
    console.log(status, modelUrl);
      

    const newCloth = await Cloth.create({
      userId: req.user.id,
      imageUrl,
      category,
      name,
      description,
      style,
      color,
      size,
      modelUrl
    });

    res.status(201).json({
      message: "옷 업로드 및 저장 완료",
      data: newCloth,
    });
  }
);


const getClothes = asyncHandler(async (req, res) => {
    const { category, size, color, name } = req.query;

    const filter = { userId: req.user.id }; // ✅ 기본적으로 로그인한 유저만
    
    if (category) {
      filter.category = category; // ✅ 카테고리도 필터링 가능
    }

    if (color) {
      filter.color = color;
    }

    if(name) {
      filter.name = name;
    }

    if(size) {
      filter.size = size;
    }

    const clothes = await Cloth.find(filter).sort({ uploadedAt: -1 });

    res.json(clothes);
  }
);

const deleteClothes = asyncHandler(async (req, res) => {
  const clothId = req.params.id;

  if (!clothId) {
    return res.status(400).json({ error: "삭제할 ID가 없습니다." });
  }

  const result = await Cloth.deleteOne({
    _id: clothId,
    userId: req.user.id, // 본인 옷만 삭제되도록
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "삭제할 옷을 찾을 수 없습니다." });
  }

  res.json({ message: "선택된 옷 삭제 완료", deletedCount: result.deletedCount });
});


const modifyCloth = asyncHandler(async (req, res) => {
  const clothId = req.params.id;
  const { category, size, style, name, description, color } = req.body;

  // 유효성 검사
  if (category && !["top", "bottom"].includes(category)) {
    return res.status(400).json({ error: "카테고리는 top 또는 bottom만 가능합니다." });
  }

  if (size && !["XS", "S", "M", "L", "XL", "2XL"].includes(size)) {
    return res.status(400).json({ error: "사이즈를 선택해주세요." });
  }

  if (style && !["casual", "formal", "sporty", "street", "other"].includes(style)) {
    return res.status(400).json({ error: "스타일을 선택해주세요." });
  }

  const cloth = await Cloth.findOne({ _id: clothId, userId: req.user.id });
  if (!cloth) {
    return res.status(404).json({ error: "옷을 찾을 수 없습니다." });
  }

  if (category) cloth.category = category;
  if (size) cloth.size = size;
  if (style) cloth.style = style;
  if (name !== undefined) cloth.name = name;
  if (description !== undefined) cloth.description = description;

  if (color) {
    if (Array.isArray(color)) {
      cloth.color = color;
    } else if (typeof color === "string") {
      cloth.color = color.split(",").map((c) => c.trim()).filter(Boolean);
    }
  }

  await cloth.save();

  res.json({ message: "옷 정보 수정 완료", data: cloth }); // ✅ 바로 cloth로 응답
});



module.exports = { uploadCloth, getClothes, deleteClothes, modifyCloth};
