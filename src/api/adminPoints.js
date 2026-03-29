import http from './http'

export function listMerchantPoints(merchantId, params) {
  return http.get(`/admin/merchants/${merchantId}/points`, { params })
}

export function adjustMerchantPoints(merchantId, data) {
  return http.post(`/admin/merchants/${merchantId}/points/adjust`, data)
}

