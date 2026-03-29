import http from './http'

export function listPricingRules(params) {
  return http.get('/admin/system/pricing-rules', { params })
}

export function createPricingRule(data) {
  return http.post('/admin/system/pricing-rules', data)
}

export function updatePricingRule(ruleId, data) {
  return http.put(`/admin/system/pricing-rules/${ruleId}`, data)
}

export function deactivatePricingRule(ruleId) {
  return http.put(`/admin/system/pricing-rules/${ruleId}/deactivate`)
}

