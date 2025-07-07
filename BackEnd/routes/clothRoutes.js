const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { 
   uploadCloth, 
   getClothes, 
   deleteClothes, 
   modifyCloth
 } = require("../controllers/clothesController");


router
.route("/")
.get(getClothes)
.delete(deleteClothes)
.post(upload.single("image"), uploadCloth);

router
.route("/:id")
.patch(modifyCloth);  // 특정 옷 ID에 대한 수정

module.exports = router;