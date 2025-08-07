#!/bin/bash

echo "🛠 디지털 옷장 프로젝트 Docker 기반 배포 시작"

# 1. Docker 설치 여부 확인
if ! command -v docker &> /dev/null; then
  echo "❗ Docker가 설치되어 있지 않습니다. 설치 후 다시 시도하세요."
  exit 1
fi
if ! command -v docker-compose &> /dev/null; then
  echo "❗ Docker Compose가 설치되어 있지 않습니다. 설치 후 다시 시도하세요."
  exit 1
fi
echo "✅ Docker & Compose 설치 확인 완료"

# 2. .env 파일 자동 생성 (백엔드/프론트 구분)
echo "⚙️ .env 파일 생성 중..."
BACK_ENV="./BackEnd/.env"
FRONT_ENV="./FrontEnd_Closet/.env"

if [ ! -f "$BACK_ENV" ]; then
cat <<EOF > "$BACK_ENV"
MONGO_URI=mongodb://mongo:27017/weather_closet
JWT_SECRET=your_jwt_secret_key
EOF
  echo "✅ 백엔드 .env 생성 완료"
else
  echo "🟡 백엔드 .env 이미 존재"
fi

if [ ! -f "$FRONT_ENV" ]; then
cat <<EOF > "$FRONT_ENV"
VITE_BACKEND_URL=http://localhost:3000
EOF
  echo "✅ 프론트엔드 .env 생성 완료"
else
  echo "🟡 프론트엔드 .env 이미 존재"
fi

# 3. 포트 3000 점유 프로세스 중지
echo "🔍 포트 3000 점유 중인 프로세스 확인..."
PID=$(lsof -ti:3000)
if [ -n "$PID" ]; then
  echo "⚠️ PID $PID 가 포트 3000 사용 중 → 종료"
  kill -9 $PID
fi

# 4. 기존 컨테이너 종료 및 정리
echo "🧹 기존 컨테이너 정리..."
docker-compose down --remove-orphans

# 5. nginx.conf 복사 (React Router 404 해결)
NGINX_CONF="./FrontEnd_Closet/nginx.conf"
cat <<EOF > "$NGINX_CONF"
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
EOF
echo "✅ Nginx 설정 파일 생성 완료"

# 6. Docker 이미지 빌드 및 실행
echo "🐳 Docker 이미지 빌드 시작..."
docker-compose up --build -d

# 7. 완료 안내
echo "✅ 배포 완료!"
IP=\$(curl -s http://checkip.amazonaws.com)
echo "🌐 접속 주소: http://\$IP"
