import http from '../http'

export function listMerchants(params) {
  return http.get('/admin/merchants', { params })
}

export function getMerchant(id) {
  return http.get(`/admin/merchants/${id}`)
}

export function createMerchant(data) {
  return http.post('/admin/merchants', data)
}

export function updateMerchant(id, data) {
  return http.put(`/admin/merchants/${id}`, data)
}

export function enableMerchant(id) {
  return http.post(`/admin/merchants/${id}/enable`)
}

export function disableMerchant(id) {
  return http.post(`/admin/merchants/${id}/disable`)
}

export function listMerchantDevices(merchantId) {
  return http.get(`/admin/merchants/${merchantId}/devices`)
}

export function createMerchantDevice(merchantId, data) {
  return http.post(`/admin/merchants/${merchantId}/devices`, data)
}

export function listMerchantActivities(merchantId, params) {
  return http.get(`/admin/merchants/${merchantId}/activities`, { params })
}

export function getMerchantActivity(merchantId, activityId) {
  return http.get(`/admin/merchants/${merchantId}/activities/${activityId}`)
}

export function getMerchantActivityTemplateVersions(merchantId, activityId) {
  return http.get(`/admin/merchants/${merchantId}/activities/${activityId}/template-versions`)
}

export function getMerchantActivityDevices(merchantId, activityId) {
  return http.get(`/admin/merchants/${merchantId}/activities/${activityId}/devices`)
}
