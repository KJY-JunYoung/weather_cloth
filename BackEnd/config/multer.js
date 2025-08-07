const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.body.userId;
    const clothId = req.body.clothId || `cloth_${Date.now()}`;

    if (!userId) return cb(new Error("userId가 필요합니다."), null);

    let dest;

    if (file.fieldname === "mannequin") {
      dest = path.join(__dirname, "..", "data", `user_${userId}`, "mannequin");
    } else {
      dest = path.join(__dirname, "..", "data", `user_${userId}`, "clothes", clothId);
    }

    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.fieldname}${path.extname(file.originalname)}`;
    cb(null, filename);
  },
});

// ✅ multer 인스턴스를 생성해서 export
const upload = multer({ storage });

module.exports = upload;
