import http from './http'

export function listMerchantPayments(merchantId, params) {
  return http.get(`/admin/merchants/${merchantId}/payments`, { params })
}

export function getPayment(id) {
  return http.get(`/admin/payments/${id}`)
}

