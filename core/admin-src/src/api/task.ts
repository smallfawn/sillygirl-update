import request from './index'

// 获取任务列表
export function getTasks(current = 1, pageSize = 20) {
  return request.get('/tasks', { params: { current, pageSize } })
}

// 创建/更新任务
export function saveTask(data: Record<string, unknown>) {
  return request.post('/tasks', data)
}

// 删除任务
export function deleteTask(taskId: string) {
  return request.delete('/tasks', { data: { task_id: taskId } })
}

// 获取任务编辑器选项
export function getTaskSelects(taskId?: string) {
  return request.get('/task/selects', { params: { task_id: taskId } })
}

// 手动执行任务
export function runTask(taskId: string) {
  return request.get('/tasks/run', { params: { task_id: taskId } })
}
