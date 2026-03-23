import request from './index'

// 获取插件列表
export function getPluginList(params?: {
  current?: number
  pageSize?: number
  activeKey?: string
  keyword?: string
  class?: string
  origin?: string[]
  init?: string
}) {
  return request.get('/plugins/list.json', { params })
}

// 获取代理脚本列表
export function getProxyScripts() {
  return request.get('/proxy/scripts')
}

// 获取代理规则
export function getProxyRules(keyword?: string) {
  return request.get('/proxy/rules', { params: { keyword } })
}

// 搜索昵称
export function searchNickname(type: 'user' | 'group', keyword: string, platform?: string) {
  return request.get('/nickname/labels', {
    params: {
      [type === 'group' ? 'gkeyword' : 'ukeyword']: keyword,
      platform,
    },
  })
}
