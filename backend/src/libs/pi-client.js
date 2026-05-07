// PI系统客户端封装
import axios from 'axios';

class PIClient {
  constructor() {
    this.baseUrl = process.env.PI_WEB_API_URL || 'https://pi-server/piwebapi';
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5秒
  }

  /**
   * 获取认证头
   */
  getAuthHeaders() {
    const token = process.env.PI_API_TOKEN;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 写入单个标签值
   * @param {string} tagName - PI标签名
   * @param {number} value - 值
   * @param {string} timestamp - 时间戳 (ISO8601)
   */
  async writeValue(tagName, value, timestamp) {
    const url = `${this.baseUrl}/points?name=${encodeURIComponent(tagName)}/value`;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios.put(
          url,
          { value, timestamp },
          { headers: this.getAuthHeaders(), timeout: 10000 }
        );
        return { success: true, data: response.data };
      } catch (error) {
        console.error(`PI write attempt ${attempt} failed:`, error.message);
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        }
      }
    }

    return { success: false, error: `Failed after ${this.maxRetries} attempts` };
  }

  /**
   * 批量写入标签值
   * @param {Array} tags - 标签数组 [{tag, value, timestamp}, ...]
   */
  async batchWriteValues(tags) {
    const results = [];

    for (const tag of tags) {
      const result = await this.writeValue(tag.tag, tag.value, tag.timestamp);
      results.push({ tag: tag.tag, ...result });
    }

    return results;
  }

  /**
   * 读取标签历史值
   * @param {string} tagName - PI标签名
   * @param {string} startTime - 开始时间
   * @param {string} endTime - 结束时间
   */
  async readHistory(tagName, startTime, endTime) {
    const url = `${this.baseUrl}/streams/${encodeURIComponent(tagName)}/summary`;

    try {
      const response = await axios.get(url, {
        headers: this.getAuthHeaders(),
        params: { startTime, endTime, interval: '1m' },
        timeout: 30000
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('PI read history failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const piClient = new PIClient();
export default piClient;