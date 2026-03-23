import request from './index'

// 登录
export function login(data: { username: string; password: string }) {
  return request.post('/login/account', data)
}

// 登出
export function logout() {
  return request.post('/login/outLogin')
}

// 获取当前用户信息
export function getCurrentUser() {
  return request.get('/currentUser')
}
