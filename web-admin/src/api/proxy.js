import request from './request'
import { updateStorage } from './storage'

export function queryProxyList(params) {
  return request({
    url: '/api/storage/list',
    method: 'get',
    params: {
      keys: 'proxies',
      ...params,
    },
  })
}

export function queryProxyScripts() {
  return request({
    url: '/api/proxy/scripts',
    method: 'get',
  })
}

export function queryProxyRules(keyword) {
  return request({
    url: '/api/proxy/rules',
    method: 'get',
    params: { keyword },
  })
}

export function saveProxyConfig(id, data) {
  return updateStorage({
    [`proxies.${id}`]: `o:${JSON.stringify(data)}`,
  })
}

export function deleteProxyConfig(id) {
  return updateStorage({
    [`proxies.${id}`]: '',
  })
}
