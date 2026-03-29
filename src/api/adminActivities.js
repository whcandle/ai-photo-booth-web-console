import http from './http'

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

