import request from './request'
import { updateStorage } from './storage'

export function queryPluginList(params) {
  return request({
    url: '/api/plugins/list.json',
    method: 'get',
    params,
  })
}

export function installPlugin(uuid) {
  return updateStorage({ [`plugins.${uuid}`]: 'install' })
}

export function uninstallPlugin(uuid) {
  return updateStorage({ [`plugins.${uuid}`]: '' })
}

export function setPluginDisable(uuid, disabled) {
  return updateStorage({ [`plugin_disable.${uuid}`]: Boolean(disabled) })
}

export function setPluginDebug(uuid, enabled) {
  return updateStorage({ [`plugin_debug.${uuid}`]: Boolean(enabled) })
}
