import http from './http'

export function getDeviceActivities(deviceId) {
  return http.get(`/device/${deviceId}/activities`)
}

export function getActivityTemplates(deviceId, activityId) {
  return http.get(`/device/${deviceId}/activities/${activityId}/templates`)
}
