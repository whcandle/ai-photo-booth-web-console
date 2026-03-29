import http from './http'

export function listMembershipPlans(params) {
  return http.get('/admin/system/membership-plans', { params })
}

export function createMembershipPlan(data) {
  return http.post('/admin/system/membership-plans', data)
}

export function updateMembershipPlan(planId, data) {
  return http.put(`/admin/system/membership-plans/${planId}`, data)
}

export function changeMembershipPlanStatus(planId, data) {
  // data: { status: 'ACTIVE' | 'INACTIVE' }
  return http.put(`/admin/system/membership-plans/${planId}/changeStatus`, data)
}

