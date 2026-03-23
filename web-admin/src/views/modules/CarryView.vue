<script setup>
import { onMounted, reactive } from 'vue'
import {
  deleteCarryGroup,
  queryCarryGroupSelects,
  queryCarryGroups,
  saveCarryGroup,
} from '../../api/carry'

const state = reactive({
  loading: false,
  saving: false,
  deletingId: '',
  current: 1,
  pageSize: 10,
  total: 0,
  list: [],
  groupNames: {},
  platforms: [],
  botsOptions: [],
  scriptsMap: {},
  message: '',
  error: '',
})

const form = reactive({
  chat_id: '',
  chat_name: '',
  remark: '',
  platform: '',
  in: true,
  out: false,
  enable: true,
  deduplication: true,
  fromText: '',
  includeText: '',
  excludeText: '',
  allowedText: '',
  prohibitedText: '',
  botsText: '',
  scriptsText: '',
})

function parseCsv(text) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function csvText(arr) {
  return Array.isArray(arr) ? arr.join(',') : ''
}

async function fetchList() {
  state.loading = true
  state.error = ''
  try {
    const res = await queryCarryGroups({
      current: state.current,
      pageSize: state.pageSize,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
  } catch (error) {
    state.error = error.message || '获取搬运规则失败'
  } finally {
    state.loading = false
  }
}

async function fetchSelects() {
  try {
    const res = await queryCarryGroupSelects({
      chat_id: form.chat_id,
      platform: form.platform,
    })
    const data = res?.data || {}
    state.groupNames = data.group_names || {}
    state.platforms = Array.isArray(data.platforms) ? data.platforms : []
    state.botsOptions = Array.isArray(data.bots_id) ? data.bots_id : []
    state.scriptsMap = data.scripts || {}
    if (!form.platform && state.platforms.length) {
      form.platform = state.platforms[0]
    }
  } catch (error) {
    state.error = error.message || '获取搬运辅助信息失败'
  }
}

function resetForm() {
  form.chat_id = ''
  form.chat_name = ''
  form.remark = ''
  form.platform = state.platforms[0] || ''
  form.in = true
  form.out = false
  form.enable = true
  form.deduplication = true
  form.fromText = ''
  form.includeText = ''
  form.excludeText = ''
  form.allowedText = ''
  form.prohibitedText = ''
  form.botsText = ''
  form.scriptsText = ''
}

function editGroup(item) {
  form.chat_id = item.chat_id || ''
  form.chat_name = item.chat_name || ''
  form.remark = item.remark || ''
  form.platform = item.platform || form.platform
  form.in = Boolean(item.in)
  form.out = Boolean(item.out)
  form.enable = Boolean(item.enable)
  form.deduplication = Boolean(item.deduplication)
  form.fromText = csvText(item.from)
  form.includeText = csvText(item.include)
  form.excludeText = csvText(item.exclude)
  form.allowedText = csvText(item.allowed)
  form.prohibitedText = csvText(item.prohibited)
  form.botsText = csvText(item.bots_id)
  form.scriptsText = csvText(item.scripts)
  fetchSelects()
}

async function submitGroup() {
  if (!form.chat_id) {
    state.error = '请填写群号(chat_id)'
    return
  }

  state.saving = true
  state.error = ''
  state.message = ''
  try {
    const payload = {
      chat_id: form.chat_id,
      chat_name: form.chat_name,
      remark: form.remark,
      platform: form.platform,
      in: form.in,
      out: form.out,
      enable: form.enable,
      deduplication: form.deduplication,
      from: parseCsv(form.fromText),
      include: parseCsv(form.includeText),
      exclude: parseCsv(form.excludeText),
      allowed: parseCsv(form.allowedText),
      prohibited: parseCsv(form.prohibitedText),
      bots_id: parseCsv(form.botsText),
      scripts: parseCsv(form.scriptsText),
    }

    const res = await saveCarryGroup(payload)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '保存失败')
    }
    state.message = `规则已保存：${payload.chat_id}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '保存失败'
  } finally {
    state.saving = false
  }
}

async function toggleEnable(item) {
  state.error = ''
  state.message = ''
  try {
    const res = await saveCarryGroup({
      chat_id: item.chat_id,
      enable: !item.enable,
    })
    if (!res?.success) {
      throw new Error(res?.errorMessage || '切换启用状态失败')
    }
    state.message = `${item.chat_id} 已${item.enable ? '停用' : '启用'}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '切换启用状态失败'
  }
}

async function handleDelete(chatId) {
  if (!window.confirm(`确定删除搬运规则 ${chatId} 吗？`)) {
    return
  }

  state.deletingId = chatId
  state.error = ''
  state.message = ''
  try {
    const res = await deleteCarryGroup(chatId)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除失败')
    }
    state.message = `已删除：${chatId}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '删除失败'
  } finally {
    state.deletingId = ''
  }
}

function prevPage() {
  if (state.current <= 1) {
    return
  }
  state.current -= 1
  fetchList()
}

function nextPage() {
  const pageCount = Math.max(1, Math.ceil(state.total / state.pageSize))
  if (state.current >= pageCount) {
    return
  }
  state.current += 1
  fetchList()
}

onMounted(async () => {
  await fetchSelects()
  await fetchList()
})
</script>

<template>
  <section class="carry-page">
    <section class="panel">
      <h3>消息搬运规则</h3>
      <p class="hint">支持规则分页查看、新增/编辑、启停与删除。多值字段均用英文逗号分隔。</p>

      <div class="form-grid">
        <label>
          群号(chat_id)
          <input v-model.trim="form.chat_id" placeholder="必填，如 123456" />
        </label>
        <label>
          群名称
          <input v-model.trim="form.chat_name" placeholder="可选" />
        </label>
        <label>
          备注
          <input v-model.trim="form.remark" placeholder="可选" />
        </label>
        <label>
          平台
          <select v-model="form.platform" @change="fetchSelects">
            <option v-for="p in state.platforms" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>
        <label>
          采集源(from)
          <input v-model.trim="form.fromText" placeholder="多个 chat_id 用逗号分隔" />
        </label>
        <label>
          工作机器人(bots_id)
          <input v-model.trim="form.botsText" :placeholder="state.botsOptions.join(',') || '可选，逗号分隔'" />
        </label>
        <label>
          包含词(include)
          <input v-model.trim="form.includeText" placeholder="逗号分隔" />
        </label>
        <label>
          排除词(exclude)
          <input v-model.trim="form.excludeText" placeholder="逗号分隔" />
        </label>
        <label>
          白名单(allowed)
          <input v-model.trim="form.allowedText" placeholder="逗号分隔" />
        </label>
        <label>
          黑名单(prohibited)
          <input v-model.trim="form.prohibitedText" placeholder="逗号分隔" />
        </label>
        <label>
          处理脚本(scripts)
          <input
            v-model.trim="form.scriptsText"
            :placeholder="Object.keys(state.scriptsMap).slice(0, 6).join(',') || '脚本uuid逗号分隔'"
          />
        </label>
      </div>

      <div class="checks">
        <label><input v-model="form.in" type="checkbox" /> 采集(In)</label>
        <label><input v-model="form.out" type="checkbox" /> 转发(Out)</label>
        <label><input v-model="form.enable" type="checkbox" /> 启用</label>
        <label><input v-model="form.deduplication" type="checkbox" /> 文本去重</label>
      </div>

      <div class="actions">
        <button class="primary" :disabled="state.saving" @click="submitGroup">
          {{ state.saving ? '保存中...' : '保存规则' }}
        </button>
        <button :disabled="state.saving" @click="resetForm">重置表单</button>
      </div>

      <p v-if="state.message" class="msg success">{{ state.message }}</p>
      <p v-if="state.error" class="msg error">{{ state.error }}</p>
    </section>

    <section class="panel">
      <div class="table-head">
        <strong>规则列表</strong>
        <span>共 {{ state.total }} 条</span>
      </div>

      <div v-if="state.loading" class="empty">加载中...</div>
      <div v-else-if="!state.list.length" class="empty">暂无规则</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>群号</th>
              <th>名称</th>
              <th>平台</th>
              <th>方向</th>
              <th>状态</th>
              <th>采集源</th>
              <th>脚本</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in state.list" :key="item.chat_id">
              <td>{{ item.chat_id }}</td>
              <td>{{ item.chat_name || state.groupNames[item.chat_id] || item.remark || '-' }}</td>
              <td>{{ item.platform || '-' }}</td>
              <td>{{ item.in ? '采集' : '' }}{{ item.in && item.out ? ' / ' : '' }}{{ item.out ? '转发' : '' }}</td>
              <td>
                <button class="tag" :class="item.enable ? 'enabled' : 'disabled'" @click="toggleEnable(item)">
                  {{ item.enable ? '已启用' : '已停用' }}
                </button>
              </td>
              <td>{{ Array.isArray(item.from) && item.from.length ? item.from.join(',') : '-' }}</td>
              <td>{{ Array.isArray(item.scripts) && item.scripts.length ? item.scripts.join(',') : '-' }}</td>
              <td>
                <div class="row-actions">
                  <button @click="editGroup(item)">编辑</button>
                  <button
                    class="danger"
                    :disabled="state.deletingId === item.chat_id"
                    @click="handleDelete(item.chat_id)"
                  >
                    {{ state.deletingId === item.chat_id ? '删除中' : '删除' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pager">
        <button :disabled="state.current <= 1 || state.loading" @click="prevPage">上一页</button>
        <span>第 {{ state.current }} 页</span>
        <button :disabled="state.current >= Math.ceil(state.total / state.pageSize) || state.loading" @click="nextPage">下一页</button>
      </footer>
    </section>
  </section>
</template>

<style scoped>
.carry-page {
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
  font-size: 14px;
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

input,
select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

.checks {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checks label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  min-width: 980px;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f9fafb;
}

.tag {
  padding: 5px 9px;
  border-radius: 999px;
}

.tag.enabled {
  border-color: #a7f3d0;
  background: #ecfdf5;
  color: #047857;
}

.tag.disabled {
  border-color: #fca5a5;
  background: #fef2f2;
  color: #b91c1c;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.danger {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fef2f2;
}

.pager {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.empty {
  color: #6b7280;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
