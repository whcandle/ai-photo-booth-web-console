import http from './http'

export function getTemplates(includeDeleted = false) {
  return http.get('/admin/templates', {
    params: { includeDeleted }
  })
}

export function getTemplate(id) {
  return http.get(`/admin/templates/${id}`)
}

export function createTemplate(data) {
  return http.post('/admin/templates', data)
}

export function deleteTemplate(id) {
  return http.post(`/admin/templates/${id}/delete`)
}

export function restoreTemplate(id) {
  return http.post(`/admin/templates/${id}/restore`)
}

export function getTemplateVersions(templateId) {
  return http.get(`/admin/templates/${templateId}/versions`)
}

export function createTemplateVersion(templateId, data) {
  return http.post(`/admin/templates/${templateId}/versions`, data)
}

export function updateTemplateVersion(templateId, versionId, data) {
  return http.put(`/admin/templates/${templateId}/versions/${versionId}`, data)
}

export function deleteTemplateVersion(templateId, versionId) {
  return http.delete(`/admin/templates/${templateId}/versions/${versionId}`)
}

export function activateTemplateVersion(templateId, versionId) {
  return http.post(`/admin/templates/${templateId}/versions/${versionId}/activate`)
}