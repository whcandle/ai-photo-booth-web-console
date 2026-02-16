import http from './http'

/**
 * Providers API
 * 获取提供商列表
 * GET /api/v1/admin/providers
 */
export function listProviders() {
  return http.get('/admin/providers')
}

/**
 * 创建提供商
 * POST /api/v1/admin/providers
 * @param {Object} data - 提供商数据
 */
export function createProvider(data) {
  return http.post('/admin/providers', data)
}

/**
 * 更新提供商
 * PUT /api/v1/admin/providers/{providerId}
 * @param {Number} providerId - 提供商ID
 * @param {Object} data - 更新数据
 */
export function updateProvider(providerId, data) {
  return http.put(`/admin/providers/${providerId}`, data)
}
