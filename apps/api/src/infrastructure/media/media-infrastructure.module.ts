import { DynamicModule, Global, Module } from '@nestjs/common';
import {
  MEDIA_ASSET_REPOSITORY,
  MEDIA_JOB_QUEUE,
  OBJECT_STORAGE,
} from '@sorriso-sentinel/domain';
import { DATABASE_POOL } from '../database/database.tokens';
import { AnonymizeMediaService } from './anonymize-media.service';
import { DrizzleMediaAssetRepository } from './drizzle-media-asset.repository';
import { ImageSanitizerService } from './image-sanitizer.service';
import { InMemoryMediaAssetRepository } from './in-memory-media-asset.repository';
import { InMemoryObjectStorage } from './in-memory-object-storage.service';
import {
  BullMqMediaJobQueue,
  InlineMediaJobQueue,
} from './media-job-queue.service';
import {
  InMemoryMediaIdGenerator,
  PostgresMediaIdGenerator,
} from './media-id.generator';
import { MEDIA_ID_GENERATOR } from './media-id-generator.port';
import { S3ObjectStorage } from './s3-object-storage.service';

function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_ACCESS_KEY &&
      process.env.S3_SECRET_KEY &&
      process.env.S3_BUCKET,
  );
}

@Global()
@Module({})
export class MediaInfrastructureModule {
  static forRoot(): DynamicModule {
    const databaseUrl = process.env.DATABASE_URL;
    const useInlineProcessing =
      process.env.MEDIA_PROCESS_INLINE === 'true' || !process.env.REDIS_URL;

    const storageProvider = hasS3Config()
      ? {
          provide: OBJECT_STORAGE,
          useFactory: async () => {
            const storage = new S3ObjectStorage();
            await storage.ensureBucket();
            return storage;
          },
        }
      : {
          provide: OBJECT_STORAGE,
          useClass: InMemoryObjectStorage,
        };

    const mediaRepositoryProvider = databaseUrl
      ? {
          provide: MEDIA_ASSET_REPOSITORY,
          useClass: DrizzleMediaAssetRepository,
        }
      : {
          provide: MEDIA_ASSET_REPOSITORY,
          useClass: InMemoryMediaAssetRepository,
        };

    const mediaIdGeneratorProvider = databaseUrl
      ? {
          provide: MEDIA_ID_GENERATOR,
          useClass: PostgresMediaIdGenerator,
        }
      : {
          provide: MEDIA_ID_GENERATOR,
          useClass: InMemoryMediaIdGenerator,
        };

    const jobQueueProvider = useInlineProcessing
      ? {
          provide: MEDIA_JOB_QUEUE,
          useClass: InlineMediaJobQueue,
        }
      : {
          provide: MEDIA_JOB_QUEUE,
          useClass: BullMqMediaJobQueue,
        };

    return {
      module: MediaInfrastructureModule,
      providers: [
        storageProvider,
        mediaRepositoryProvider,
        mediaIdGeneratorProvider,
        ImageSanitizerService,
        AnonymizeMediaService,
        InlineMediaJobQueue,
        { provide: 'BULLMQ_QUEUE', useValue: null },
        jobQueueProvider,
      ],
      exports: [
        OBJECT_STORAGE,
        MEDIA_ASSET_REPOSITORY,
        MEDIA_ID_GENERATOR,
        MEDIA_JOB_QUEUE,
        ImageSanitizerService,
        AnonymizeMediaService,
      ],
    };
  }
}
