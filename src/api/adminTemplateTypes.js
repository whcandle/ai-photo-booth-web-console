import http from './http'

/**
 * GET /api/v1/admin/template-types
 * @param {Object} params - { enabledOnly?: boolean }
 */
export function listTemplateTypes(params = {}) {
  return http.get('/admin/template-types', { params })
}

/**
 * POST /api/v1/admin/template-types
 * Body: code, name, description?, strategyKey?, designerSchemaKey?, enabled, sortOrder
 */
export function createTemplateType(data) {
  return http.post('/admin/template-types', data)
}

/**
 * PUT /api/v1/admin/template-types/{id}
 * Body: name?, description?, strategyKey?, designerSchemaKey?, sortOrder?, enabled?
 */
export function updateTemplateType(id, data) {
  return http.put(`/admin/template-types/${id}`, data)
}

/**
 * PATCH /api/v1/admin/template-types/{id}/enable
 * Body: { enabled: boolean }
 */
export function setTemplateTypeEnabled(id, enabled) {
  return http.patch(`/admin/template-types/${id}/enable`, { enabled })
}

/**
 * DELETE /api/v1/admin/template-types/{id}
 */
export function deleteTemplateType(id) {
  return http.delete(`/admin/template-types/${id}`)
}
