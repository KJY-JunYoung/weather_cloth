const express = require("express");
const router = express.Router();

const { register,login,updateUser,deleteUser, getMe } = require("../controllers/authController");

const verifyToken = require("../middlewares/authMiddleware");

router.post("/register", register);           
router.post("/login", login);                 
router.put("/update", verifyToken, updateUser);   // PUT /update - 회원정보 수정 (JWT 필요)
router.delete("/delete", verifyToken, deleteUser); // DELETE /delete - 회원탈퇴 (JWT 필요)
router.get("/me", verifyToken, getMe);        // GET /me - 내 정보 조회 (JWT 필요)

module.exports = router;