import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { loadAuthConfigFromEnv } from '@sorriso-sentinel/shared';

export interface PasswordHasherPort {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  private readonly cost = loadAuthConfigFromEnv().bcryptCost;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.cost);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');
