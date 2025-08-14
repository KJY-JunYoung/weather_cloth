// 외부 패키지 및 모듈 불러오기
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const fsp = require("fs/promises");   // ← 비동기 파일 I/O
const path = require("path");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { mannequinGenerationQueue } = require("../utils/queueService");
const Mannequin = require("../models/Mannequin"); // ← 오타/중복 정리

const DATA_ROOT = process.env.DATA_DIR || path.join(__dirname, "..", "data");

// 마네킹 생성
exports.createMannequin = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const file = req.file;
  if (!file) return res.status(400).json({ message: "이미지를 업로드해주세요." });

  const filePath = path.join(__dirname, "..", "public", "images", "mannequins", file.filename);
  if (!fs.existsSync(filePath)) return res.status(500).json({ error: "파일 저장 실패" });

  await mannequinGenerationQueue.add("generateMannequin", {
    userId,
    imagePath: filePath,
    fileName: file.filename,
  });

  res.status(202).json({ message: "마네킹 생성 요청이 접수되었습니다. 완료 후 자동 반영됩니다." });
});

// 마네킹 삭제
exports.deleteMannequin = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
  if (!user.hasMannequin) return res.status(400).json({ message: "이미 마네킹이 없습니다." });

  if (user.imageURL) {
    const imagePath = path.join(__dirname, "..", "public", user.imageURL);
    try {
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    } catch (err) {
      console.error("사진 삭제 실패:", err.message);
    }
    user.imageURL = null;
  }

  user.hasMannequin = false;
  user.mannequinModelUrl = null;
  await user.save();

  res.status(200).json({ message: "마네킹 및 사진 정보가 삭제되었습니다." });
});

// 상태 조회
exports.getMannequinStatus = asyncHandler(async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ message: "userId is required" });

  try {
    const jobs = await mannequinGenerationQueue.getJobs(["waiting", "active", "completed", "failed"]);
    const recentJob = jobs.reverse().find((job) => job?.data?.userId === userId);
    if (!recentJob) return res.status(404).json({ status: "not_found" });

    const status = await recentJob.getState();

    if (status === "completed") {
      // ⚠️ 스키마에 맞춰 user vs userId 중 하나로 통일하세요 (여기선 user로 가정)
      const mannequin = await Mannequin.findOne({ user: userId }).select("modelUrl").lean();
      return res.json({ status: "completed", modelUrl: mannequin?.modelUrl || null });
    }

    if (status === "failed") {
      return res.json({ status: "failed", error: recentJob.failedReason });
    }

    return res.json({ status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "서버 오류" });
  }
});

// 파라미터(JSON) 읽기
exports.getMannequinAddress = asyncHandler(async (req, res) => {
  // ⚠️ 스키마: Mannequin에 user 필드가 있다고 가정 (ref: User)
  const doc = await Mannequin.findOne({ user: req.user.id }).select("modelUrl").lean();
  if (!doc) return res.status(404).json({ error: "마네킹 정보를 찾을 수 없습니다." });

  const rawPath = doc.modelUrl; // 이 값이 JSON 경로 또는 URL이라고 가정
  if (!rawPath) return res.status(400).json({ error: "JSON 파일 경로가 저장되어 있지 않습니다." });

  // URL이면 네트워크에서 읽기
  if (/^https?:\/\//i.test(rawPath)) {
    const resp = await axios.get(rawPath, { responseType: "json" });
    return res.json(resp.data);
  }

  // 로컬 파일이면 DATA_ROOT 기준으로 안전하게 읽기
  const absPath = path.isAbsolute(rawPath) ? rawPath : path.join(DATA_ROOT, rawPath);
  const normalized = path.normalize(absPath);
  if (!normalized.startsWith(path.normalize(DATA_ROOT))) {
    return res.status(400).json({ error: "허용되지 않은 경로" });
  }

  try {
    const jsonText = await fsp.readFile(normalized, "utf8"); // ← fsp 사용
    const data = JSON.parse(jsonText);
    return res.json(data);
  } catch (e) {
    console.error("JSON 읽기 실패:", e);
    return res.status(500).json({ error: "JSON 읽기/파싱 실패", detail: e.message });
  }
});
