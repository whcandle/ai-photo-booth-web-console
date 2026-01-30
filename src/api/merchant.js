import http from './http'

export function getActivities(merchantId) {
  return http.get('/merchant/activities', { params: { merchantId } })
}

export function getActivity(activityId) {
  return http.get(`/merchant/activities/${activityId}`)
}

export function createActivity(data) {
  return http.post('/merchant/activities', data)
}

export function bindTemplatesToActivity(activityId, templateIds) {
  return http.post(`/merchant/activities/${activityId}/templates`, { templateIds })
}

export function getTemplateVersions() {
  return http.get('/merchant/template-versions')
}

export function bindTemplateVersionsToActivity(activityId, templateVersionIds) {
  return http.post(`/merchant/activities/${activityId}/template-versions`, { templateVersionIds })
}

export function getActivityTemplateVersions(activityId) {
  return http.get(`/merchant/activities/${activityId}/template-versions`)
}

export function bindDevicesToActivity(activityId, deviceIds) {
  return http.post(`/merchant/activities/${activityId}/devices`, { deviceIds })
}

export function getActivityDevices(activityId) {
  return http.get(`/merchant/activities/${activityId}/devices`)
}

export function getDevices(merchantId) {
  return http.get('/merchant/devices', { params: { merchantId } })
}

export function createDevice(data) {
  return http.post('/merchant/devices', data)
}
