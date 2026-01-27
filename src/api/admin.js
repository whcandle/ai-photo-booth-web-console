import http from './http'

export function getTemplates() {
  return http.get('/admin/templates')
}

export function createTemplate(data) {
  return http.post('/admin/templates', data)
}

export function createTemplateVersion(templateId, data) {
  return http.post(`/admin/templates/${templateId}/versions`, data)
}
