import http from './http'

/**
 * Provider API Keys API
 * 获取提供商API密钥列表
 * GET /api/v1/admin/providers/{providerId}/keys
 * @param {Number} providerId - 提供商ID
 */
export function listKeys(providerId) {
  return http.get(`/admin/providers/${providerId}/keys`)
}

/**
 * 创建提供商API密钥
 * POST /api/v1/admin/providers/{providerId}/keys
 * @param {Number} providerId - 提供商ID
 * @param {Object} data - 密钥数据（包含明文 apiKey）
 */
export function createKey(providerId, data) {
  return http.post(`/admin/providers/${providerId}/keys`, data)
}

/**
 * 禁用提供商API密钥
 * PUT /api/v1/admin/providers/{providerId}/keys/{keyId}/disable
 * @param {Number} providerId - 提供商ID
 * @param {Number} keyId - 密钥ID
 */
export function disableKey(providerId, keyId) {
  return http.put(`/admin/providers/${providerId}/keys/${keyId}/disable`)
}
