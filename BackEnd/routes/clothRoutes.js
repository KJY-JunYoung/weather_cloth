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
.patch(modifyCloth)
.post(upload.single("image"), uploadCloth);

module.exports = router;