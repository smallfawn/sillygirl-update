import request from './request'

export function queryCarryGroups(params) {
  return request({
    url: '/api/carry/groups',
    method: 'get',
    params,
  })
}

export function queryCarryGroupSelects(params) {
  return request({
    url: '/api/carry/group_selects',
    method: 'get',
    params,
  })
}

export function saveCarryGroup(data) {
  return request({
    url: '/api/carry/group',
    method: 'post',
    data,
  })
}

export function deleteCarryGroup(chatId) {
  return request({
    url: '/api/carry/group',
    method: 'delete',
    data: { chat_id: chatId },
  })
}
