import request from './request'

export function loginAccount(payload) {
  return request({
    url: '/api/login/account',
    method: 'post',
    data: payload,
  })
}

export function logout() {
  return request({
    url: '/api/login/outLogin',
    method: 'post',
  })
}

export function getCurrentUser() {
  return request({
    url: '/api/currentUser',
    method: 'get',
  })
}
