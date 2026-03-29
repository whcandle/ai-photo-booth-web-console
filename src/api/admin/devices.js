import http from '../http'

export function listAdminDevices(params) {
  return http.get('/admin/devices', { params })
}

export function bindDeviceMerchant(deviceId, merchantId) {
  return http.put(`/admin/devices/${deviceId}/bind-merchant`, { merchantId })
}

export function unbindDeviceMerchant(deviceId) {
  return http.put(`/admin/devices/${deviceId}/unbind-merchant`)
}
