import request from '@/utils/request'

export const getPlugins = () => {
  return request.get('/api/plugins')
}

export const getPlugin = (uuid) => {
  return request.get(`/api/plugins/${uuid}`)
}

export const savePlugin = (data) => {
  return request.post('/api/plugins', data)
}

export const deletePlugin = (uuid) => {
  return request.delete(`/api/plugins/${uuid}`)
}

export const togglePlugin = (uuid, enable) => {
  return request.post(`/api/plugins/${uuid}/toggle`, { enable })
}

export const getPublicPlugins = () => {
  return request.get('/api/plugins/public')
}

export const publishPlugin = (data) => {
  return request.post('/api/plugins/publish', data)
}

export const subscribePlugin = (data) => {
  return request.post('/api/plugins/subscribe', data)
}

export const downloadPlugin = (uuid) => {
  return request.get(`/api/plugins/download/${uuid}`)
}
