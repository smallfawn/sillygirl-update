import request from './index'

// 获取搬运群列表
export function getCarryGroups(current = 1, pageSize = 20) {
  return request.get('/carry/groups', { params: { current, pageSize } })
}

// 获取搬运群名称映射
export function getCarryGroupNames() {
  return request.get('/carry/group_names')
}

// 获取搬运群编辑器选项
export function getCarryGroupSelects(chatId: string, platform?: string) {
  return request.get('/carry/group_selects', { params: { chat_id: chatId, platform } })
}

// 创建/更新搬运群
export function saveCarryGroup(data: Record<string, unknown>) {
  return request.post('/carry/group', data)
}

// 删除搬运群
export function deleteCarryGroup(chatId: string) {
  return request.delete('/carry/group', { data: { chat_id: chatId } })
}
