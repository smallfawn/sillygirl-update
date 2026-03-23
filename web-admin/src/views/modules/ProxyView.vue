<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

const hasData = () => state.list.length > 0

function normalizeList(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      const id = row.key
      const value = String(row.value || '')
      if (!id || !value.startsWith('o:')) return null
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
    ElMessage.error(error.message || '获取规则候选失败')
  }
}

async function appendRule(rule) {
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
    ElMessage.error(error.message || '获取脚本列表失败')
  }
}

async function fetchList() {
  state.loading = true
  try {
    const res = await queryProxyList({
      current: state.current,
      pageSize: state.pageSize,
    })
    state.total = Number(res?.total || 0)
    state.list = normalizeList(res?.data)
  } catch (error) {
    ElMessage.error(error.message || '获取代理配置失败')
  } finally {
    state.loading = false
  }
}

function getStorageError(res, key) {
  if (!res?.errors) return ''
  return res.errors[key] || ''
}

async function submitProxy() {
  if (!form.id || !form.server || !form.port) {
    ElMessage.warning('请至少填写 ID、服务地址和端口')
    return
  }

  state.saving = true
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
    if (err) throw new Error(err)

    ElMessage.success(`代理配置已保存：${form.id}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存代理配置失败')
  } finally {
    state.saving = false
  }
}

async function removeProxy(id) {
  if (!id) return
  try {
    await ElMessageBox.confirm(`确定删除代理配置「${id}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.deletingId = id
  try {
    const res = await deleteProxyConfig(id)
    const err = getStorageError(res, `proxies.${id}`)
    if (err) throw new Error(err)
    ElMessage.success(`已删除代理配置：${id}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '删除代理配置失败')
  } finally {
    state.deletingId = ''
  }
}

function handlePageChange(page) {
  state.current = page
  fetchList()
}

onMounted(async () => {
  await Promise.all([fetchList(), fetchScripts()])
})
</script>

<template>
  <section class="proxy-page">
    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>代理设置</h3>
          <p class="hint">维护代理节点、域名规则与脚本绑定。规则/脚本可按行或逗号分隔输入。</p>
        </div>
        <el-space>
          <el-button text :loading="state.loading" @click="fetchList">刷新</el-button>
        </el-space>
      </div>

      <el-form :model="form" label-position="top" :disabled="state.saving">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="配置 ID">
              <el-input v-model.trim="form.id" placeholder="建议使用 uuid" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="名称">
              <el-input v-model.trim="form.name" placeholder="展示名称" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="4">
            <el-form-item label="类型">
              <el-input v-model.trim="form.type" placeholder="如 socks5/http" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="5">
            <el-form-item label="服务地址">
              <el-input v-model.trim="form.server" placeholder="如 127.0.0.1" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="3">
            <el-form-item label="端口">
              <el-input v-model.number="form.port" type="number" min="1" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :xs="24" :sm="12">
            <el-form-item label="规则（rules）">
              <el-input
                v-model.trim="form.rulesText"
                type="textarea"
                :rows="5"
                placeholder="每行一个域名规则，如 api.telegram.org"
                @input="fetchRules((form.rulesText.split(/[,\n]/).slice(-1)[0] || '').trim())"
              />
              <el-space wrap class="suggestions" v-if="state.ruleOptions.length">
                <el-tag
                  v-for="rule in state.ruleOptions"
                  :key="rule"
                  type="info"
                  effect="plain"
                  class="clickable"
                  @click="appendRule(rule)"
                >{{ rule }}</el-tag>
              </el-space>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="脚本 UUID（plugins）">
              <el-input
                v-model.trim="form.pluginsText"
                type="textarea"
                :rows="5"
                placeholder="每行一个插件 UUID"
              />
              <p class="tip" v-if="Object.keys(state.scriptsMap).length">
                可用脚本：
                <span v-for="(name, id) in state.scriptsMap" :key="id">{{ name }} ({{ id }})；</span>
              </p>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :md="6">
            <el-switch v-model="form.enable" active-text="启用此代理" />
          </el-col>
        </el-row>

        <el-space style="margin-top: 8px">
          <el-button type="primary" :loading="state.saving" @click="submitProxy">保存配置</el-button>
          <el-button @click="resetForm">清空表单</el-button>
        </el-space>
      </el-form>
    </el-card>

    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>代理配置列表</h3>
          <p class="hint">共 {{ state.total }} 条</p>
        </div>
      </div>

      <el-table :data="state.list" stripe v-loading="state.loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="140" />
        <el-table-column prop="name" label="名称" width="160" />
        <el-table-column label="地址" min-width="160">
          <template #default="{ row }">{{ row.server }}:{{ row.port }}</template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column label="规则数" width="90">
          <template #default="{ row }">{{ row.rules.length }}</template>
        </el-table-column>
        <el-table-column label="脚本数" width="90">
          <template #default="{ row }">{{ row.plugins.length }}</template>
        </el-table-column>
        <el-table-column label="启用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" @click="fillForm(row)">编辑</el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :loading="state.deletingId === row.id"
                @click="removeProxy(row.id)"
              >删除</el-button>
            </el-space>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <el-pagination
          background
          layout="prev, pager, next, jumper"
          :current-page="state.current"
          :page-size="state.pageSize"
          :total="state.total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </section>
</template>

<style scoped>
.proxy-page {
  display: grid;
  gap: 12px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.hint {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.suggestions {
  margin-top: 6px;
}

.clickable {
  cursor: pointer;
}

.tip {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
