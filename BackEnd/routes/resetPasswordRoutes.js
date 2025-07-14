const express = require("express");
const router = express.Router();
const { resetPassword } = require("../controllers/resetPasswordController");

router.post("/reset-password", resetPassword);

module.exports = router;