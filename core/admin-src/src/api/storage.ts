import request from './index'

// 获取存储值
export function getStorage(keys?: string, search?: string) {
  return request.get('/storage', { params: { keys, search } })
}

// 获取存储列表（分页）
export function getStorageList(current = 1, pageSize = 20, keys = '') {
  return request.get('/storage/list', { params: { current, pageSize, keys } })
}

// 更新存储值
export function updateStorage(data: Record<string, unknown>, uuid?: string) {
  return request.put('/storage', data, { params: { uuid } })
}

// 删除存储项（通过设置为空值实现）
export function deleteStorage(bucketKey: string) {
  return request.put('/storage', { [bucketKey]: '' })
}
