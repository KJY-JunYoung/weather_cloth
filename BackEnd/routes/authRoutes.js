const express = require('express');
const router = express.Router();
const { register, login , logout , getMyinfo , updatemyinfo , getmypage , resetPassword} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyToken, getMyInfo);
router.patch('/me', verifyToken, updateMyInfo);
router.get('/mypage', verifyToken, getMyPage);
router.post('/find-email', findEmail);
router.post('/reset-password', resetPassword);

module.exports = router;


