const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const verifyToken = require("../middlewares/authMiddleware");

router.use((req, res, next) => {
  console.log("✅ clothRouter 진입!");
  next();
});

const { 
  uploadCloth, 
  getClothes, 
  deleteClothes, 
  modifyCloth,
  getClothStatus
} = require("../controllers/clothesController");
console.log("🔍 getClothes:", getClothes);
// 📌 전체 옷 목록 조회 + 옷 등록
router
  .route("/")
  .get(verifyToken, getClothes)
  .post(
    verifyToken,
    upload.fields([
      { name: "cloth_front", maxCount: 1 },
      { name: "cloth_back", maxCount: 1 }
    ]),
    uploadCloth
  );


router.get("/status/:jobId", getClothStatus);
// 📌 특정 옷 수정 / 삭제
router
  .route("/:id")
  .patch(verifyToken, modifyCloth)
  .delete(verifyToken, deleteClothes);

// 📌 AI 작업 상태 조회


module.exports = router;
