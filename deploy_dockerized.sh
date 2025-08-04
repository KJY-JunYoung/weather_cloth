#!/bin/bash

echo "🔍 포트 3000을 점유 중인 도커 컨테이너 검색 중..."
CONTAINER_ID=$(docker ps -q --filter "publish=3000")

if [ -n "$CONTAINER_ID" ]; then
  echo "⚠️ 포트 3000을 사용 중인 컨테이너 ($CONTAINER_ID) 중지 중..."
  docker stop $CONTAINER_ID
fi

echo "🧹 기존 컨테이너 종료 및 정리 중..."
docker-compose down

echo "🧼 Docker 불필요한 리소스 정리..."
docker system prune -af

echo "📦 Docker 빌드 및 컨테이너 실행 중..."
docker-compose up -d --build

echo "✅ 배포 완료!"
echo "🌐 접속 주소: http://$(curl -s http://checkip.amazonaws.com)"
