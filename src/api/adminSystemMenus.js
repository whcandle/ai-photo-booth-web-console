import http from './http'

export function listMenus(params) {
  return http.get('/admin/system/menus', { params })
}

export function listMenuTree() {
  return http.get('/admin/system/menus/tree')
}

export function getMenu(menuId) {
  return http.get(`/admin/system/menus/${menuId}`)
}

export function createMenu(data) {
  return http.post('/admin/system/menus', data)
}

export function updateMenu(menuId, data) {
  return http.put(`/admin/system/menus/${menuId}`, data)
}

export function deleteMenu(menuId) {
  return http.delete(`/admin/system/menus/${menuId}`)
}

