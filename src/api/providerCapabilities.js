import http from './http'

/**
 * Provider Capabilities API
 * 获取提供商能力列表
 * GET /api/v1/admin/providers/{providerId}/capabilities
 * @param {Number} providerId - 提供商ID
 */
export function listCapabilities(providerId) {
  return http.get(`/admin/providers/${providerId}/capabilities`)
}

/**
 * 创建提供商能力
 * POST /api/v1/admin/providers/{providerId}/capabilities
 * @param {Number} providerId - 提供商ID
 * @param {Object} data - 能力数据
 */
export function createCapability(providerId, data) {
  return http.post(`/admin/providers/${providerId}/capabilities`, data)
}

/**
 * 更新提供商能力
 * PUT /api/v1/admin/providers/{providerId}/capabilities/{capabilityId}
 * @param {Number} providerId - 提供商ID
 * @param {Number} capabilityId - 能力ID
 * @param {Object} data - 更新数据
 */
export function updateCapability(providerId, capabilityId, data) {
  return http.put(`/admin/providers/${providerId}/capabilities/${capabilityId}`, data)
}
