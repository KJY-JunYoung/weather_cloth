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
   modifyCloth
 } = require("../controllers/clothesController");


router
  .route("/")
  .get(verifyToken, getClothes)  // 여기에 직접 붙이기
  .post(verifyToken, upload.single("image"), uploadCloth);

router
.route("/:id")
.patch(modifyCloth)
.delete(verifyToken, deleteClothes);  // 특정 옷 ID에 대한 수정

module.exports = router;