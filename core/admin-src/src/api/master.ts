import request from './index'

// 获取主人列表
export function getMasterList() {
  return request.get('/master/list')
}

// 添加主人
export function addMaster(data: { number: string; platform?: string; nickname?: string }) {
  return request.post('/master', data)
}

// 删除主人
export function deleteMaster(data: { number: string; platform?: string }) {
  return request.delete('/master', { data })
}
