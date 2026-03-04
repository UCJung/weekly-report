import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { BusinessException } from '../common/filters/business-exception';

// Mock dependencies
const mockPrisma = {
  member: {
    findUnique: mock(() => null),
    create: mock(() => null),
    update: mock(() => null),
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

  // ──── register ────
  describe('register', () => {
    it('should throw CONFLICT if email already exists', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({ id: '1', email: 'test@test.com' } as never);
      await expect(
        service.register({ name: '홍길동', email: 'test@test.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(BusinessException);
    });

    it('should create member with PENDING status', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);
      mockPrisma.member.create.mockResolvedValueOnce({
        id: 'new-id',
        name: '홍길동',
        email: 'new@test.com',
        accountStatus: 'PENDING',
      } as never);

      const result = await service.register({ name: '홍길동', email: 'new@test.com', password: 'password123' });
      expect(result.accountStatus).toBe('PENDING');
      expect(result.email).toBe('new@test.com');
    });

    it('should hash the password before storing', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);
      mockPrisma.member.create.mockImplementationOnce(async ({ data }: { data: { password: string } }) => {
        const isHashed = data.password !== 'plainpassword' && data.password.length > 20;
        expect(isHashed).toBe(true);
        return { id: 'x', name: 'test', email: 'x@x.com', accountStatus: 'PENDING' };
      });

      await service.register({ name: 'test', email: 'x@x.com', password: 'plainpassword' });
    });
  });

  // ──── validateMember ────
  describe('validateMember', () => {
    it('should return null if member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);
      const result = await service.validateMember('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should throw BusinessException with ACCOUNT_PENDING if accountStatus is PENDING', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        isActive: true,
        accountStatus: 'PENDING',
      } as never);
      await expect(
        service.validateMember('test@test.com', 'password'),
      ).rejects.toBeInstanceOf(BusinessException);
    });

    it('should throw BusinessException with ACCOUNT_INACTIVE if accountStatus is INACTIVE', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        isActive: true,
        accountStatus: 'INACTIVE',
      } as never);
      await expect(
        service.validateMember('test@test.com', 'password'),
      ).rejects.toBeInstanceOf(BusinessException);
    });

    it('should return null if member is isActive=false', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'test@test.com',
        password: 'hashed',
        isActive: false,
        accountStatus: 'ACTIVE',
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
        accountStatus: 'ACTIVE',
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
        accountStatus: 'ACTIVE',
      };
      mockPrisma.member.findUnique.mockResolvedValueOnce(mockMember as never);
      const result = await service.validateMember('test@test.com', 'correct-password');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('should update accountStatus to ACTIVE when APPROVED member logs in', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      const mockMember = {
        id: '1',
        email: 'test@test.com',
        password: hashed,
        isActive: true,
        accountStatus: 'APPROVED',
      };
      mockPrisma.member.findUnique.mockResolvedValueOnce(mockMember as never);
      mockPrisma.member.update.mockResolvedValueOnce({ ...mockMember, accountStatus: 'ACTIVE' } as never);
      const result = await service.validateMember('test@test.com', 'correct-password');
      expect(result).not.toBeNull();
      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { accountStatus: 'ACTIVE' } }),
      );
    });
  });

  // ──── login ────
  describe('login', () => {
    it('should return access token, refresh token, and mustChangePassword flag', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      const result = await service.login({
        id: 'user-1',
        name: 'Test User',
        email: 'test@test.com',
        roles: ['MEMBER'],
        mustChangePassword: false,
      });
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.mustChangePassword).toBe(false);
      expect(result.user.id).toBe('user-1');
      expect(result.user.teamId).toBeNull();
    });

    it('should include mustChangePassword=true in response when set', async () => {
      mockJwtService.sign.mockReturnValue('mock-token');
      const result = await service.login({
        id: 'user-2',
        name: '초기 사용자',
        email: 'init@test.com',
        roles: ['MEMBER'],
        mustChangePassword: true,
      });
      expect(result.mustChangePassword).toBe(true);
    });
  });

  // ──── changePassword ────
  describe('changePassword', () => {
    it('should throw UnauthorizedException if member not found', async () => {
      mockPrisma.member.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.changePassword('nonexistent', { currentPassword: 'old', newPassword: 'newpass123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw BusinessException if current password is wrong', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        password: hashed,
      } as never);
      await expect(
        service.changePassword('user-1', { currentPassword: 'wrong-password', newPassword: 'newpass123' }),
      ).rejects.toBeInstanceOf(BusinessException);
    });

    it('should update password and set mustChangePassword=false on success', async () => {
      const hashed = await bcrypt.hash('correct-password', 10);
      mockPrisma.member.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        password: hashed,
      } as never);
      mockPrisma.member.update.mockResolvedValueOnce({ id: 'user-1' } as never);

      const result = await service.changePassword('user-1', {
        currentPassword: 'correct-password',
        newPassword: 'NewPass123!',
      });

      expect(result.message).toBe('비밀번호가 변경되었습니다.');
      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mustChangePassword: false }),
        }),
      );
    });
  });

  // ──── getMe ────
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
        roles: ['MEMBER'],
      } as never);
      const result = await service.getMe('1');
      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe('테스트');
    });
  });
});
