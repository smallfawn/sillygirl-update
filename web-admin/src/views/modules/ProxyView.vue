<script setup>
import { computed, onMounted, reactive } from 'vue'
import {
  deleteProxyConfig,
  queryProxyList,
  queryProxyRules,
  queryProxyScripts,
  saveProxyConfig,
} from '../../api/proxy'

const state = reactive({
  loading: false,
  saving: false,
  deletingId: '',
  list: [],
  total: 0,
  current: 1,
  pageSize: 50,
  scriptsMap: {},
  ruleOptions: [],
  message: '',
  error: '',
})

const form = reactive({
  id: '',
  name: '',
  type: 'socks5',
  server: '',
  port: 1080,
  enable: true,
  rulesText: '',
  pluginsText: '',
})

const hasData = computed(() => state.list.length > 0)

function normalizeList(raw) {
  if (!Array.isArray(raw)) {
    return []
  }

  return raw
    .map((row) => {
      const id = row.key
      const value = String(row.value || '')
      if (!id || !value.startsWith('o:')) {
        return null
      }
      try {
        const parsed = JSON.parse(value.slice(2))
        return {
          id,
          name: parsed.name || id,
          type: parsed.type || '',
          server: parsed.server || '',
          port: Number(parsed.port || 0),
          enable: Boolean(parsed.enable),
          rules: Array.isArray(parsed.rules) ? parsed.rules : [],
          plugins: Array.isArray(parsed.plugins) ? parsed.plugins : [],
          raw: parsed,
        }
      } catch (error) {
        return {
          id,
          name: id,
          type: '-',
          server: '-',
          port: 0,
          enable: false,
          rules: [],
          plugins: [],
          raw: null,
          parseError: error.message,
        }
      }
    })
    .filter(Boolean)
}

function parseMultiText(text) {
  return text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function resetForm() {
  form.id = ''
  form.name = ''
  form.type = 'socks5'
  form.server = ''
  form.port = 1080
  form.enable = true
  form.rulesText = ''
  form.pluginsText = ''
}

function fillForm(row) {
  form.id = row.id
  form.name = row.raw?.name || ''
  form.type = row.raw?.type || 'socks5'
  form.server = row.raw?.server || ''
  form.port = Number(row.raw?.port || 1080)
  form.enable = Boolean(row.raw?.enable)
  form.rulesText = Array.isArray(row.raw?.rules) ? row.raw.rules.join('\n') : ''
  form.pluginsText = Array.isArray(row.raw?.plugins) ? row.raw.plugins.join('\n') : ''
}

async function fetchRules(keyword = '') {
  const key = keyword.trim()
  if (!key) {
    state.ruleOptions = []
    return
  }
  try {
    const res = await queryProxyRules(key)
    const data = res?.data || {}
    state.ruleOptions = Object.keys(data)
  } catch (error) {
    state.error = error.message || '获取规则候选失败'
  }
}

function appendRule(rule) {
  const current = parseMultiText(form.rulesText)
  if (!current.includes(rule)) {
    current.push(rule)
  }
  form.rulesText = current.join('\n')
}

async function fetchScripts() {
  try {
    const res = await queryProxyScripts()
    state.scriptsMap = res?.data || {}
  } catch (error) {
    state.error = error.message || '获取脚本列表失败'
  }
}

async function fetchList() {
  state.loading = true
  state.error = ''
  try {
    const res = await queryProxyList({
      current: state.current,
      pageSize: state.pageSize,
    })
    state.total = Number(res?.total || 0)
    state.list = normalizeList(res?.data)
  } catch (error) {
    state.error = error.message || '获取代理配置失败'
  } finally {
    state.loading = false
  }
}

function getStorageError(res, key) {
  if (!res?.errors) {
    return ''
  }
  return res.errors[key] || ''
}

async function submitProxy() {
  if (!form.id || !form.server || !form.port) {
    state.error = '请至少填写 ID、服务地址和端口'
    return
  }

  state.saving = true
  state.error = ''
  state.message = ''

  try {
    const payload = {
      id: form.id,
      name: form.name || form.id,
      type: form.type,
      server: form.server,
      port: Number(form.port || 0),
      enable: Boolean(form.enable),
      rules: parseMultiText(form.rulesText),
      plugins: parseMultiText(form.pluginsText),
    }

    const res = await saveProxyConfig(form.id, payload)
    const err = getStorageError(res, `proxies.${form.id}`)
    if (err) {
      throw new Error(err)
    }

    state.message = `代理配置已保存：${form.id}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '保存代理配置失败'
  } finally {
    state.saving = false
  }
}

async function removeProxy(id) {
  if (!id) {
    return
  }
  if (!window.confirm(`确定删除代理配置「${id}」吗？`)) {
    return
  }

  state.deletingId = id
  state.error = ''
  state.message = ''
  try {
    const res = await deleteProxyConfig(id)
    const err = getStorageError(res, `proxies.${id}`)
    if (err) {
      throw new Error(err)
    }
    state.message = `已删除代理配置：${id}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '删除代理配置失败'
  } finally {
    state.deletingId = ''
  }
}

onMounted(async () => {
  await Promise.all([fetchList(), fetchScripts()])
})
</script>

<template>
  <section class="proxy-page">
    <section class="panel">
      <h3>代理设置</h3>
      <p class="hint">支持维护代理节点、域名规则与脚本绑定。规则/脚本均可按行或逗号分隔输入。</p>

      <div class="form-grid">
        <label>
          配置 ID
          <input v-model.trim="form.id" placeholder="建议使用 uuid" />
        </label>
        <label>
          名称
          <input v-model.trim="form.name" placeholder="展示名称" />
        </label>
        <label>
          类型
          <input v-model.trim="form.type" placeholder="如 socks5/http" />
        </label>
        <label>
          服务地址
          <input v-model.trim="form.server" placeholder="如 127.0.0.1" />
        </label>
        <label>
          端口
          <input v-model.number="form.port" type="number" min="1" />
        </label>
        <label class="checkbox-row">
          <input v-model="form.enable" type="checkbox" />
          启用此代理
        </label>
      </div>

      <div class="multi-grid">
        <label>
          规则（rules）
          <textarea
            v-model.trim="form.rulesText"
            rows="5"
            placeholder="每行一个域名规则，如 api.telegram.org"
            @input="fetchRules(form.rulesText.split(/[,\n]/).slice(-1)[0] || '')"
          />
          <div class="suggestions" v-if="state.ruleOptions.length">
            <button v-for="rule in state.ruleOptions" :key="rule" @click="appendRule(rule)">{{ rule }}</button>
          </div>
        </label>

        <label>
          脚本 UUID（plugins）
          <textarea v-model.trim="form.pluginsText" rows="5" placeholder="每行一个插件 UUID" />
          <p class="tip" v-if="Object.keys(state.scriptsMap).length">
            可用脚本：
            <span v-for="(name, id) in state.scriptsMap" :key="id">{{ name }} ({{ id }})；</span>
          </p>
        </label>
      </div>

      <div class="actions">
        <button class="primary" :disabled="state.saving" @click="submitProxy">
          {{ state.saving ? '保存中...' : '保存配置' }}
        </button>
        <button :disabled="state.saving" @click="resetForm">清空表单</button>
        <button :disabled="state.loading" @click="fetchList">刷新列表</button>
      </div>

      <p v-if="state.message" class="msg success">{{ state.message }}</p>
      <p v-if="state.error" class="msg error">{{ state.error }}</p>
    </section>

    <section class="panel">
      <div class="table-head">
        <strong>代理配置列表</strong>
        <span>共 {{ state.total }} 条</span>
      </div>

      <div v-if="state.loading" class="empty">加载中...</div>
      <div v-else-if="!hasData" class="empty">暂无配置</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>名称</th>
              <th>地址</th>
              <th>类型</th>
              <th>规则数</th>
              <th>脚本数</th>
              <th>启用</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in state.list" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.server }}:{{ row.port }}</td>
              <td>{{ row.type || '-' }}</td>
              <td>{{ row.rules.length }}</td>
              <td>{{ row.plugins.length }}</td>
              <td>{{ row.enable ? '是' : '否' }}</td>
              <td>
                <div class="row-actions">
                  <button @click="fillForm(row)">编辑</button>
                  <button class="danger" :disabled="state.deletingId === row.id" @click="removeProxy(row.id)">
                    {{ state.deletingId === row.id ? '删除中...' : '删除' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.proxy-page {
  display: grid;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

h3 {
  margin: 0;
  color: #111827;
}

.hint {
  margin: 8px 0 12px;
  color: #6b7280;
  font-size: 13px;
}

.form-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 13px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
}

input,
textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

.multi-grid {
  margin-top: 10px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
}

.suggestions {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.suggestions button {
  border: 1px solid #ddd6fe;
  background: #f5f3ff;
  color: #6d28d9;
  border-radius: 999px;
  padding: 4px 10px;
}

.tip {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

button {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 7px 12px;
  background: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
}

.danger {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fef2f2;
}

.msg {
  margin: 8px 0 0;
  font-size: 13px;
}

.msg.success {
  color: #047857;
}

.msg.error {
  color: #b91c1c;
}

.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #374151;
  font-size: 14px;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
  color: #1f2937;
  font-size: 13px;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.empty {
  padding: 20px 10px;
  text-align: center;
  color: #6b7280;
}

@media (max-width: 960px) {
  .form-grid,
  .multi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
