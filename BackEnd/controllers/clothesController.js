const Cloth = require("../models/Cloth");

const uploadCloth = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 없습니다." });
    }

    const { category } = req.body;

    if (!["top", "bottom"].includes(category)) {
      return res.status(400).json({ error: "카테고리는 top 또는 bottom만 가능합니다." });
    }

    const imageUrl = `/images/clothes/${req.file.filename}`;

    const newCloth = await Clothes.create({
      imageUrl,
      category,
    });

    res.status(201).json({
      message: "옷 업로드 및 저장 완료",
      data: newCloth,
    });
  } catch (err) {
    console.error("❌ 옷 저장 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
};


const getClothes = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const clothes = await Cloth.find(filter).sort({ uploadedAt: -1 });  // 프론트에서 요청할대 category가 있어야함
    // const clothes = await Clothes.find().sort({ uploadedAt: -1 }); // 최신순 정렬
    res.json(clothes);
  } catch (err) {
    console.error("❌ 옷 목록 조회 실패:", err);
    res.status(500).json({ error: "서버 에러" });
  }
};

module.exports = { uploadCloth, getClothes };
