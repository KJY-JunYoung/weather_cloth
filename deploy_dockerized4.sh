#!/bin/bash

# [환경설정]
BACKEND_DIR="./BackEnd"
FRONTEND_DIR="./FrontEnd_Closet"
COMPOSE_FILE="docker-compose.yml"

# ===== .env 파일 자동 생성 (백엔드) =====
echo "⚙️  .env 파일 생성 (백엔드)"
cat > $BACKEND_DIR/.env <<EOF
PORT=3000
CLIENT_ORIGIN=http://54.180.109.119:5173
DB_CONNECT=mongodb://mongo:27017/mycloset
JWT_SECRET=my_secret_key
JWT_EXPIRES_IN=2h
REDIS_HOST=redis
REDIS_PORT=6379
EOF

# ===== .env 파일 자동 생성 (프론트엔드) =====
echo "⚙️  .env 파일 생성 (프론트엔드)"
cat > $FRONTEND_DIR/.env <<EOF
VITE_API_URL=http://54.180.109.119:3000
EOF

# ===== 포트 점유 컨테이너 자동 정리 =====
echo "🧹 기존 컨테이너 종료 및 제거 (포트 3000 점유 프로세스 포함)"
EXISTING_CONTAINER=$(docker ps -q --filter "publish=3000")
if [ -n "$EXISTING_CONTAINER" ]; then
  echo "⚠️ 컨테이너 $EXISTING_CONTAINER 가 포트 3000을 점유 중. 종료합니다."
  docker stop $EXISTING_CONTAINER
fi

# ===== docker-compose up =====
echo "🐳 Docker 이미지 빌드 및 실행"
docker-compose -f $COMPOSE_FILE down
docker-compose -f $COMPOSE_FILE up --build -d

# ===== 배포 완료 안내 =====
echo "✅ 배포 완료!"
echo "🌐 접속 주소: http://54.180.109.119"
