// config/multer.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // file.fieldname 또는 req.url, req.body.type 등으로 분기 가능
    let folder = "clothes"; // 기본값

    if (file.fieldname === "mannequin") {
      folder = "mannequins";
    }

    cb(null, path.join(__dirname, "..", "public", "images", folder));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

module.exports = upload;
