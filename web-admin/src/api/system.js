import request from '@/utils/request'

export const getSystemInfo = () => {
  return request.get('/api/system/info')
}

export const getLogs = (params) => {
  return request.get('/api/logs', { params })
}

export const getTasks = () => {
  return request.get('/api/tasks')
}

export const addTask = (data) => {
  return request.post('/api/tasks', data)
}

export const removeTask = (id) => {
  return request.delete(`/api/tasks/${id}`)
}

export const getAdapters = () => {
  return request.get('/api/adapters')
}

export const getReplies = () => {
  return request.get('/api/replies')
}

export const saveReply = (data) => {
  return request.post('/api/replies', data)
}

export const deleteReply = (id) => {
  return request.delete(`/api/replies/${id}`)
}

export const getCarries = () => {
  return request.get('/api/carries')
}

export const saveCarry = (data) => {
  return request.post('/api/carries', data)
}

export const deleteCarry = (id) => {
  return request.delete(`/api/carries/${id}`)
}
