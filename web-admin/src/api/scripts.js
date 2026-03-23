import request from './request'
import { updateStorage } from './storage'

export function queryScriptContent(uuid) {
  return request({
    url: '/api/storage',
    method: 'get',
    params: {
      keys: `plugins.${uuid}`,
    },
  })
}

export function saveScriptContent(uuid, content) {
  return updateStorage(
    {
      [`plugins.${uuid}`]: content,
    },
    uuid,
  )
}

export function deleteScriptContent(uuid) {
  return updateStorage(
    {
      [`plugins.${uuid}`]: '',
    },
    uuid,
  )
}
