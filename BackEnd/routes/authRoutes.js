const express = require('express');
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");

const {
  register,
  login,
  logout,
  getMyInfo,
  updateMyInfo,
  getMyPage,
  findEmail,
  resetPassword,
  deleteAccount,
  changePassword,
  requestResetPassword
} = require("../controllers/authController");

// 회원가입/로그인/기본 인증 관련 라우팅
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// 유저 정보 관련
router.get('/me', verifyToken, getMyInfo);
router.patch('/me', verifyToken, updateMyInfo);
router.get('/mypage', verifyToken, getMyPage);

// 이메일/비밀번호 찾기
router.post('/find-email', findEmail);
router.post('/reset-password', resetPassword);
router.post('/change-password', verifyToken, changePassword);
router.post('/request-reset', requestResetPassword);

// 회원 탈퇴
router.delete('/me', verifyToken, deleteAccount);

module.exports = router;
