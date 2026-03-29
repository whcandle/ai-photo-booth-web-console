import http from './http'

export function listUsers(params) {
  return http.get('/admin/system/users', { params })
}

export function getUser(userId) {
  return http.get(`/admin/system/users/${userId}`)
}

export function createUser(data) {
  return http.post('/admin/system/users', data)
}

export function updateUser(userId, data) {
  return http.put(`/admin/system/users/${userId}`, data)
}

export function deleteUser(userId) {
  return http.delete(`/admin/system/users/${userId}`)
}

export function resetUserPassword(data) {
  // { userId, password }
  return http.put('/admin/system/users/resetPwd', data)
}

export function changeUserStatus(data) {
  // { userId, status }
  return http.put('/admin/system/users/changeStatus', data)
}

