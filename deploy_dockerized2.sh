#!/bin/bash

# =============================
# 🚀 디지털 옷장 Docker 자동 배포 스크립트
# =============================

echo "\n🛠 디지털 옷장 프로젝트 Docker 기반 배포 시작"

# 1. Docker 설치 확인
if ! command -v docker &> /dev/null; then
  echo "❌ Docker 미설치됨. 설치가 필요합니다."
  exit 1
fi
if ! command -v docker-compose &> /dev/null; then
  echo "❌ Docker Compose 미설치됨. 설치가 필요합니다."
  exit 1
fi

echo "✅ Docker 설치됨"
echo "✅ Docker Compose 설치됨"

# 2. .env 자동 생성
BACK_ENV="./back/.env"
if [ ! -f "$BACK_ENV" ]; then
  echo "⚙️ .env 파일 생성 (백엔드)"
  mkdir -p ./back
  cat <<EOL > $BACK_ENV
PORT=3000
MONGO_URI=mongodb://mongo:27017/weather_cloth
JWT_SECRET=your_jwt_secret
EOL
fi

FRONT_ENV="./front/.env"
if [ ! -f "$FRONT_ENV" ]; then
  echo "⚙️ .env 파일 생성 (프론트엔드)"
  mkdir -p ./front
  cat <<EOL > $FRONT_ENV
VITE_API_BASE_URL=http://localhost:3000/api
EOL
fi

# 3. Nginx 설정 파일 복사
NGINX_CONF_PATH="./front/nginx.conf"
if [ ! -f "$NGINX_CONF_PATH" ]; then
  echo "⚙️ nginx.conf 생성"
  cat <<EOL > $NGINX_CONF_PATH
server {
  listen 80;
  server_name localhost;

  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files \$uri \$uri/ /index.html;
  }

  error_page 404 /index.html;
}
EOL
fi

# 4. 포트 3000 점유 컨테이너 제거
echo "🔍 포트 3000 점유 중인 컨테이너 정리 중..."
CONTAINER_ID=$(docker ps -q --filter "publish=3000")
if [ -n "$CONTAINER_ID" ]; then
  echo "⚠️ 컨테이너 $CONTAINER_ID 가 포트 3000 사용 중 → 중지"
  docker stop $CONTAINER_ID
fi

# 5. 기존 컨테이너 제거
echo "🧹 기존 컨테이너 종료 및 제거"
docker-compose down || true

# 6. Docker 빌드 및 실행
echo "🐳 Docker 이미지 빌드 및 실행"
docker-compose up -d --build

# 7. 완료
echo "✅ 배포 완료!"
PUBLIC_IP=$(curl -s ifconfig.me)
echo "🌐 접속 주소: http://$PUBLIC_IP"
