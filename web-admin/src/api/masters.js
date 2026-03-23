import request from './request'

export function queryMasters() {
  return request({
    url: '/api/master/list',
    method: 'get',
  })
}

export function addMaster(data) {
  return request({
    url: '/api/master',
    method: 'post',
    data,
  })
}

export function removeMaster(data) {
  return request({
    url: '/api/master',
    method: 'delete',
    data,
  })
}
