import { QUEUE_NAMES } from './queues.js';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function main(): Promise<void> {
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'Worker scaffold started',
      redisUrl: redisUrl.replace(/:[^:@]+@/, ':***@'),
      queues: Object.values(QUEUE_NAMES),
    }),
  );
}

void main();
