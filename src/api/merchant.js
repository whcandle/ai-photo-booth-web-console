import http from './http'

export function getActivities(merchantId) {
  return http.get('/merchant/activities', { params: { merchantId } })
}

export function createActivity(data) {
  return http.post('/merchant/activities', data)
}

export function bindTemplatesToActivity(activityId, templateIds) {
  return http.post(`/merchant/activities/${activityId}/templates`, { templateIds })
}

export function bindDevicesToActivity(activityId, deviceIds) {
  return http.post(`/merchant/activities/${activityId}/devices`, { deviceIds })
}

export function getDevices(merchantId) {
  return http.get('/merchant/devices', { params: { merchantId } })
}

export function createDevice(data) {
  return http.post('/merchant/devices', data)
}
