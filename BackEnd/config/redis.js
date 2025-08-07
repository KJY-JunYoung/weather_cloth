// config/redis.js

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'redis',         // 기본값 'redis'
  port: Number(process.env.REDIS_PORT) || 6379,    // 숫자 변환 필수!
  // password: process.env.REDIS_PASSWORD,         // 비밀번호 쓰면 이 줄 활성화
  // db: 0,                                        // db 번호도 쓸 수 있음 (보통 0)
  // retryStrategy: times => Math.min(times * 50, 2000), // 재시도 정책(선택)
});

redis.on('connect', () => {
  console.log('✅ Redis 연결 성공');
});
redis.on('error', (err) => {
  console.error('❌ Redis 연결 오류:', err);
});

module.exports = redis;
