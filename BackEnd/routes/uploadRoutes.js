const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const { 
  uploadCloth,
  getClothes
 } = require("../controllers/clothesController");

router
.post("/upload-cloth", upload.single("image"), uploadCloth);

router
.get("/clothes", getClothes);

module.exports = router;