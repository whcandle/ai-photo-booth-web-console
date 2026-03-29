import http from './http'

export function getPermissions() {
  return http.get('/admin/system/permissions')
}

