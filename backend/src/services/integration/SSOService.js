// SSO服务 - 梦想云集成
import axios from 'axios';
import { ssoClient as ssoClientLib } from '../../libs/sso-client.js';
import { User, IntegrationJob } from '../../models/index.js';

class SSOService {
  constructor() {
    this.client = ssoClientLib;
    this.syncInterval = 60 * 60 * 1000; // 1小时同步一次
    this.tokenCache = new Map();
  }

  /**
   * 处理SSO登录回调
   * @param {string} code - 授权码
   */
  async handleCallback(code) {
    // 1. 用授权码换取令牌
    const tokenResult = await this.client.exchangeCodeForToken(code);
    if (!tokenResult.success) {
      throw new Error(`Token exchange failed: ${tokenResult.error}`);
    }

    // 2. 获取用户信息
    const userInfo = await this.client.getUserInfo(tokenResult.accessToken);
    if (!userInfo.success) {
      throw new Error(`Failed to get user info: ${userInfo.error}`);
    }

    // 3. 映射角色
    const localRole = this.client.mapRoles(userInfo.user.roles);

    // 4. 查找或创建本地用户
    const user = await this.findOrCreateUser(userInfo.user, localRole);

    // 5. 生成本地JWT
    const jwt = this.generateLocalJWT(user);

    return {
      accessToken: jwt,
      refreshToken: tokenResult.refreshToken,
      expiresIn: tokenResult.expiresIn,
      user: {
        id: user.userId,
        username: user.username,
        displayName: user.displayName,
        role: user.role
      }
    };
  }

  /**
   * 查找或创建用户
   */
  async findOrCreateUser(ssoUser, role) {
    let user = await User.findOne({ where: { ssoId: ssoUser.id } });

    if (!user) {
      user = await User.create({
        userId: `USR-${Date.now()}`,
        username: ssoUser.username,
        displayName: ssoUser.displayName,
        email: ssoUser.email,
        role: role,
        ssoId: ssoUser.id,
        ssoProvider: 'dreamcloud',
        status: 'active'
      });
    } else {
      // 更新用户信息
      await user.update({
        username: ssoUser.username,
        displayName: ssoUser.displayName,
        email: ssoUser.email,
        role: role,
        lastLoginAt: new Date()
      });
    }

    return user;
  }

  /**
   * 生成本地JWT（简化版，实际应使用jsonwebtoken库）
   */
  generateLocalJWT(user) {
    const payload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    // 实际应使用 jwt.sign(payload, secret, { expiresIn: '24h' })
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * 刷新访问令牌
   * @param {string} refreshToken
   */
  async refreshAccessToken(refreshToken) {
    const result = await this.client.refreshToken(refreshToken);
    if (!result.success) {
      throw new Error(`Token refresh failed: ${result.error}`);
    }
    return result;
  }

  /**
   * 验证令牌有效性
   * @param {string} token
   */
  async validateToken(token) {
    // 先检查本地JWT格式
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      const exp = payload.iat + 86400; // 24小时过期
      if (Date.now() / 1000 > exp) {
        return { valid: false, reason: 'token_expired' };
      }
      return { valid: true, userId: payload.sub, role: payload.role };
    } catch {
      // 不是本地JWT，尝试SSO验证
      const result = await this.client.validateToken(token);
      return { valid: result.active, reason: result.active ? null : 'invalid_token' };
    }
  }

  /**
   * 同步用户数据
   * @param {string} accessToken
   */
  async syncUserData(accessToken) {
    const userInfo = await this.client.getUserInfo(accessToken);
    if (!userInfo.success) {
      throw new Error(`Failed to get user info: ${userInfo.error}`);
    }

    const user = await User.findOne({ where: { ssoId: userInfo.user.id } });
    if (user) {
      await user.update({
        username: userInfo.user.username,
        displayName: userInfo.user.displayName,
        email: userInfo.user.email
      });
    }

    return userInfo.user;
  }

  /**
   * 执行定期用户同步任务
   */
  async runUserSync() {
    const jobId = `SSO-SYNC-${Date.now()}`;
    const job = await IntegrationJob.create({
      jobId,
      type: 'sso_user_sync',
      status: 'running',
      startedAt: new Date()
    });

    try {
      // 获取所有活跃的SSO用户并同步
      const users = await User.findAll({
        where: { ssoProvider: 'dreamcloud', status: 'active' }
      });

      for (const user of users) {
        try {
          // 实际应使用保存的accessToken
          await this.syncUserData(null);
        } catch (error) {
          console.error(`Failed to sync user ${user.userId}:`, error.message);
        }
      }

      await job.update({
        status: 'completed',
        recordsProcessed: users.length,
        completedAt: new Date()
      });

      return { success: true, synced: users.length };

    } catch (error) {
      await job.update({
        status: 'failed',
        errorDetails: error.message,
        completedAt: new Date()
      });
      throw error;
    }
  }

  /**
   * 获取同步状态
   */
  async getSyncStatus() {
    const jobs = await IntegrationJob.findAll({
      where: { type: 'sso_user_sync' },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    return {
      recentJobs: jobs.map(j => ({
        jobId: j.jobId,
        status: j.status,
        completedAt: j.completedAt,
        recordsProcessed: j.recordsProcessed
      })),
      lastSyncTime: jobs[0]?.createdAt
    };
  }

  /**
   * 登出处理
   * @param {string} userId
   */
  async logout(userId) {
    // 清除本地会话
    // 实际可能需要维护一个token黑名单
    return { success: true };
  }

  /**
   * 获取SSO配置信息
   */
  getSSOConfig() {
    return {
      provider: 'dreamcloud',
      authUrl: `${process.env.SSO_URL || 'https://sso.dreamcloud.com'}/oauth2/authorize`,
      tokenUrl: `${process.env.SSO_URL || 'https://sso.dreamcloud.com'}/oauth2/token`,
      userInfoUrl: `${process.env.SSO_URL || 'https://sso.dreamcloud.com'}/oauth2/userinfo`,
      clientId: process.env.SSO_CLIENT_ID || 'vfm-system',
      redirectUri: process.env.SSO_REDIRECT_URI || 'http://localhost:3001/api/v1/auth/callback'
    };
  }
}

export const ssoService = new SSOService();
export default SSOService;
