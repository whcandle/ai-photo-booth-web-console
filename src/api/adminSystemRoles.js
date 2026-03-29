import http from './http'

export function listRoles(params) {
  return http.get('/admin/system/roles', { params })
}

export function listAllRoles() {
  return http.get('/admin/system/roles/all')
}

export function getRole(roleId) {
  return http.get(`/admin/system/roles/${roleId}`)
}

export function createRole(data) {
  return http.post('/admin/system/roles', data)
}

export function updateRole(roleId, data) {
  return http.put(`/admin/system/roles/${roleId}`, data)
}

export function deleteRole(roleId) {
  return http.delete(`/admin/system/roles/${roleId}`)
}

export function getRoleMenuIds(roleId) {
  return http.get(`/admin/system/roles/${roleId}/menuIds`)
}

export function setRoleMenuIds(roleId, data) {
  return http.put(`/admin/system/roles/${roleId}/menuIds`, data)
}

