import { Test, TestingModule } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('should_return_ok_status', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    const controller = module.get(HealthController);
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});
