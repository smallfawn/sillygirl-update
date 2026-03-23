import request from './index'

// 获取回复规则列表
export function getReplyList(current = 1, pageSize = 20, filters?: {
  keyword?: string; value?: string; number?: string
}) {
  return request.get('/reply/list', { params: { current, pageSize, ...filters } })
}

// 创建/更新回复规则
export function saveReply(data: Record<string, unknown>) {
  return request.post('/reply', data)
}

// 删除回复规则
export function deleteReply(id: number) {
  return request.delete('/reply', { params: { id } })
}
