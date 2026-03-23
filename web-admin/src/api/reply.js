import request from './request'

export function queryReplyList(params) {
  return request({
    url: '/api/reply/list',
    method: 'get',
    params,
  })
}

export function saveReply(data) {
  return request({
    url: '/api/reply',
    method: 'post',
    data,
  })
}

export function deleteReply(id) {
  return request({
    url: '/api/reply',
    method: 'delete',
    params: { id },
  })
}
