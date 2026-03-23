import request from './request'

export function queryStorageOptions(search = '') {
  return request({
    url: '/api/storage',
    method: 'get',
    params: { search },
  })
}

export function queryStorageList(params) {
  return request({
    url: '/api/storage/list',
    method: 'get',
    params,
  })
}

export function updateStorage(payload, uuid = '') {
  return request({
    url: '/api/storage',
    method: 'put',
    params: uuid ? { uuid } : undefined,
    data: payload,
  })
}
