import request from '@/utils/request'

export const login = (data) => {
  return request.post('/api/auth/login', data)
}

export const logout = () => {
  return request.post('/api/auth/logout')
}

export const getUserInfo = () => {
  return request.get('/api/auth/info')
}
