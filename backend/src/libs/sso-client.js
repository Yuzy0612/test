// SSO客户端封装（梦想云）
import axios from 'axios';

class SSOClient {
  constructor() {
    this.ssoUrl = process.env.SSO_URL || 'https://sso.dreamcloud.com';
    this.clientId = process.env.SSO_CLIENT_ID || 'vfm-system';
    this.clientSecret = process.env.SSO_CLIENT_SECRET || '';
  }

  /**
   * 用授权码换取访问令牌
   * @param {string} code - 授权码
   */
  async exchangeCodeForToken(code) {
    const url = `${this.ssoUrl}/oauth2/token`;

    try {
      const response = await axios.post(url, {
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: process.env.SSO_REDIRECT_URI || 'http://localhost:3001/api/v1/auth/callback'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('SSO token exchange failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取用户信息
   * @param {string} accessToken - 访问令牌
   */
  async getUserInfo(accessToken) {
    const url = `${this.ssoUrl}/oauth2/userinfo`;

    try {
      const response = await axios.get(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return {
        success: true,
        user: {
          id: response.data.sub,
          username: response.data.preferred_username,
          displayName: response.data.name,
          email: response.data.email,
          roles: response.data.roles || []
        }
      };
    } catch (error) {
      console.error('SSO get user info failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 刷新令牌
   * @param {string} refreshToken - 刷新令牌
   */
  async refreshToken(refreshToken) {
    const url = `${this.ssoUrl}/oauth2/token`;

    try {
      const response = await axios.post(url, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      return {
        success: true,
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('SSO token refresh failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 验证令牌
   * @param {string} token - JWT令牌
   */
  async validateToken(token) {
    const url = `${this.ssoUrl}/oauth2/introspect`;

    try {
      const response = await axios.post(url, {
        token,
        client_id: this.clientId,
        client_secret: this.clientSecret
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      return {
        success: true,
        active: response.data.active,
        userId: response.data.sub
      };
    } catch (error) {
      console.error('SSO token validation failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 外部角色到本地角色映射
   * @param {Array} externalRoles - 外部角色数组
   */
  mapRoles(externalRoles) {
    const roleMapping = {
      'DREAMCLOUD_PRODUCTION_ENGINEER': 'production_engineer',
      'DREAMCLOUD_MEASUREMENT_ENGINEER': 'measurement_engineer',
      'DREAMCLOUD_BLOCK_MANAGER': 'block_manager',
      'DREAMCLOUD_ADMIN': 'admin'
    };

    for (const role of externalRoles) {
      if (roleMapping[role]) {
        return roleMapping[role];
      }
    }

    return 'production_engineer'; // 默认角色
  }
}

export const ssoClient = new SSOClient();
export default ssoClient;