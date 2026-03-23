import request from './request'

export function queryTasks(params) {
  return request({
    url: '/api/tasks',
    method: 'get',
    params,
  })
}

export function saveTask(data) {
  return request({
    url: '/api/tasks',
    method: 'post',
    data,
  })
}

export function deleteTask(taskId) {
  return request({
    url: '/api/tasks',
    method: 'delete',
    data: { task_id: taskId },
  })
}

export function runTask(taskId) {
  return request({
    url: '/api/tasks/run',
    method: 'get',
    params: { task_id: taskId },
  })
}
