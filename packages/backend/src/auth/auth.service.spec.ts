import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

// Mock dependencies
const mockPrisma = {
  member: {
    findUnique: mock(() => null),
  },
};

const mockJwtService = {
  sign: mock(() => 'mock-token'),
  verify: mock(() => ({ sub: 'user-id' })),
};

const mockConfigService = {
  get: mock((key: string) => {
    const config: Record<string, string> = {
      REDIS_URL: 'redis://localhost:16379',
      JWT_REFRESH_EXPIRES_IN: '7d',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_SECRET: 'test-secret',
    };
    return config[key];
  }),
};

// Mock ioredis
mock.module('ioredis', () => {
  return {
    default: class MockRedis {
      get = mock(() => Promise.resolve(null));
      set = mock(() => Promise.resolve('OK'));
      del = mock(() => Promise.resolve(1));
    },
  };
});

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(
      mockPrisma as never,
      mockJwtService as never,
      mockConfigService as never,
    );
  });

  describe('validateMember', () => {
    it('should return null if member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);
      const result = await service.validateMember('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if member is inactive', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        isActive: false,
        part: { team: {} },
      } as never);
      const result = await service.validateMember('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password is wrong', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        password: hashed,
        isActive: true,
        part: { team: {} },
      } as never);
      const result = await service.validateMember('test@test.com', 'wrong-password');
      expect(result).toBeNull();
    });

    it('should return member if credentials are valid', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      const mockMember = {
        id: '1',
        email: 'test@test.com',
        password: hashed,
        isActive: true,
        part: { team: {} },
      };
      mockPrisma.member.findUnique.mockResolvedValueOnce(mockMember as never);
      const result = await service.validateMember('test@test.com', 'correct-password');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      const result = await service.login({
        id: 'user-1',
        email: 'test@test.com',
        role: 'MEMBER',
        partId: 'part-1',
        part: { teamId: 'team-1' },
      });
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.member.id).toBe('user-1');
    });
  });

  describe('getMe', () => {
    it('should throw if user not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);
      expect(service.getMe('nonexistent')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should return user without password', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: '1',
        name: '테스트',
        email: 'test@test.com',
        password: 'hashed',
        role: 'MEMBER',
        part: { team: {} },
      } as never);
      const result = await service.getMe('1');
      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('테스트');
    });
  });
});
