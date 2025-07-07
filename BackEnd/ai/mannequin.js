const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc 이미지 배열을 입력받아 AI 분석 후 3D 마네킹 파일(.glb) 생성
 * @param {string[]} imagePaths
 * @returns {string} 생성된 모델의 URL
 */

async function generate3DModel(imagePaths) {
  console.log("체형 분석 중...");
  await new Promise(resolve => setTimeout(resolve, 1500)); // 분석 시뮬레이션

  const dummySource = path.join(__dirname, 'dummy', 'fake-user.glb'); // 샘플 파일
  const outputDir = path.join(__dirname, '..', 'public', 'models');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const filename = uuidv4() + '.glb';
  const outputPath = path.join(outputDir, filename);
  fs.copyFileSync(dummySource, outputPath); // 복사 = 생성 시뮬레이션

  return `http://localhost:3000/public/models/${filename}`; // URL 반환
}

module.exports = { generate3DModel };