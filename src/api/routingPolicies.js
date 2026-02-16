import http from './http'

/**
 * Routing Policies API
 * 获取路由策略列表
 * GET /api/v1/admin/routing-policies
 * @param {Object} params - 查询参数 { scope, merchantId, capability }
 */
export function listPolicies(params = {}) {
  return http.get('/admin/routing-policies', { params })
}

/**
 * 创建路由策略
 * POST /api/v1/admin/routing-policies
 * @param {Object} data - 策略数据
 */
export function createPolicy(data) {
  return http.post('/admin/routing-policies', data)
}

/**
 * 更新路由策略
 * PUT /api/v1/admin/routing-policies/{policyId}
 * @param {Number} policyId - 策略ID
 * @param {Object} data - 更新数据
 */
export function updatePolicy(policyId, data) {
  return http.put(`/admin/routing-policies/${policyId}`, data)
}
