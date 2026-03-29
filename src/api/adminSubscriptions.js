import http from './http'

export function listMerchantSubscriptions(merchantId, params) {
  return http.get(`/admin/merchants/${merchantId}/subscriptions`, { params })
}

export function getSubscription(id) {
  return http.get(`/admin/subscriptions/${id}`)
}

export function createMerchantSubscription(merchantId, data) {
  return http.post(`/admin/merchants/${merchantId}/subscriptions`, data)
}

export function updateSubscription(id, data) {
  return http.put(`/admin/subscriptions/${id}`, data)
}

export function deleteSubscription(id) {
  return http.delete(`/admin/subscriptions/${id}`)
}

