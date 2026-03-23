<script setup>
import { onMounted, reactive } from 'vue'
import { deleteReply, queryReplyList, saveReply } from '../../api/reply'

const state = reactive({
  loading: false,
  saving: false,
  deletingId: null,
  current: 1,
  pageSize: 10,
  total: 0,
  list: [],
  keyword: '',
  value: '',
  number: '',
  platforms: [],
  message: '',
  error: '',
})

const form = reactive({
  id: '',
  number: '',
  nickname: '',
  keyword: '',
  value: '',
  priority: 100,
  platformsText: '',
})

async function fetchList() {
  state.loading = true
  state.error = ''
  try {
    const res = await queryReplyList({
      current: state.current,
      pageSize: state.pageSize,
      keyword: state.keyword,
      value: state.value,
      number: state.number,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
    state.platforms = Array.isArray(res?.platforms) ? res.platforms : []
  } catch (error) {
    state.error = error.message || '获取自动回复列表失败'
  } finally {
    state.loading = false
  }
}

function parsePlatforms(text) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function resetForm() {
  form.id = ''
  form.number = ''
  form.nickname = ''
  form.keyword = ''
  form.value = ''
  form.priority = 100
  form.platformsText = ''
}

function editRule(item) {
  form.id = item.id
  form.number = item.number || ''
  form.nickname = item.nickname || ''
  form.keyword = item.keyword || ''
  form.value = item.value || ''
  form.priority = Number(item.priority || 100)
  form.platformsText = Array.isArray(item.platforms) ? item.platforms.join(',') : ''
}

async function submitRule() {
  if (!form.keyword || !form.value) {
    state.error = '请至少填写关键词和回复内容'
    return
  }

  state.saving = true
  state.message = ''
  state.error = ''
  try {
    const payload = {
      id: Number(form.id || 0),
      number: form.number,
      nickname: form.nickname,
      keyword: form.keyword,
      value: form.value,
      priority: Number(form.priority || 0),
      platforms: parsePlatforms(form.platformsText),
    }
    const res = await saveReply(payload)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '保存失败')
    }
    state.message = payload.id ? `规则已更新：#${payload.id}` : '规则已新增'
    await fetchList()
    if (!payload.id) {
      resetForm()
    }
  } catch (error) {
    state.error = error.message || '保存失败'
  } finally {
    state.saving = false
  }
}

async function handleDelete(id) {
  if (!window.confirm(`确定删除规则 #${id} 吗？`)) {
    return
  }
  state.deletingId = id
  state.message = ''
  state.error = ''
  try {
    const res = await deleteReply(id)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除失败')
    }
    state.message = `规则已删除：#${id}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '删除失败'
  } finally {
    state.deletingId = null
  }
}

function search() {
  state.current = 1
  fetchList()
}

function resetSearch() {
  state.keyword = ''
  state.value = ''
  state.number = ''
  state.current = 1
  fetchList()
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

onMounted(fetchList)
</script>

<template>
  <section class="reply-page">
    <section class="panel">
      <h3>自动回复规则</h3>
      <p class="hint">支持规则检索、新增、编辑和删除。平台填写用英文逗号分隔（如 wx,qq,tg）。</p>

      <div class="search-grid">
        <label>
          关键词
          <input v-model.trim="state.keyword" placeholder="模糊匹配关键词" />
        </label>
        <label>
          回复内容
          <input v-model.trim="state.value" placeholder="模糊匹配回复值" />
        </label>
        <label>
          号码
          <input v-model.trim="state.number" placeholder="用户/群号（精确）" />
        </label>
      </div>

      <div class="actions">
        <button class="primary" :disabled="state.loading" @click="search">查询</button>
        <button :disabled="state.loading" @click="resetSearch">重置</button>
      </div>
    </section>

    <section class="panel">
      <h4>新增 / 编辑规则</h4>
      <div class="form-grid">
        <label>
          规则 ID（编辑时填写）
          <input v-model.trim="form.id" placeholder="留空表示新增" />
        </label>
        <label>
          号码
          <input v-model.trim="form.number" placeholder="可选，限定用户/群" />
        </label>
        <label>
          昵称
          <input v-model.trim="form.nickname" placeholder="可选" />
        </label>
        <label>
          优先级
          <input v-model.number="form.priority" type="number" />
        </label>
        <label>
          关键词
          <input v-model.trim="form.keyword" placeholder="触发关键词" />
        </label>
        <label>
          平台
          <input v-model.trim="form.platformsText" placeholder="如 wx,qq,tg" />
        </label>
      </div>

      <label class="full-row">
        回复内容
        <textarea v-model.trim="form.value" rows="3" placeholder="触发后返回内容" />
      </label>

      <div class="actions">
        <button class="primary" :disabled="state.saving" @click="submitRule">
          {{ state.saving ? '保存中...' : '保存规则' }}
        </button>
        <button :disabled="state.saving" @click="resetForm">清空表单</button>
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
      <div v-else-if="!state.list.length" class="empty">暂无数据</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>关键词</th>
              <th>回复内容</th>
              <th>号码</th>
              <th>优先级</th>
              <th>平台</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in state.list" :key="item.id">
              <td>#{{ item.id }}</td>
              <td>{{ item.keyword }}</td>
              <td>{{ item.value }}</td>
              <td>{{ item.number || '-' }}</td>
              <td>{{ item.priority }}</td>
              <td>{{ Array.isArray(item.platforms) && item.platforms.length ? item.platforms.join(',') : '-' }}</td>
              <td>
                <div class="row-actions">
                  <button @click="editRule(item)">编辑</button>
                  <button
                    class="danger"
                    :disabled="state.deletingId === item.id"
                    @click="handleDelete(item.id)"
                  >
                    {{ state.deletingId === item.id ? '删除中' : '删除' }}
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

      <p v-if="state.platforms.length" class="platform-tip">
        当前后端平台标签：{{ state.platforms.map((p) => p.label || p.value || p).join('、') }}
      </p>
    </section>
  </section>
</template>

<style scoped>
.reply-page {
  display: grid;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

h3,
h4 {
  margin: 0;
  color: #111827;
}

.hint {
  margin: 8px 0 12px;
  color: #6b7280;
  font-size: 14px;
}

.search-grid,
.form-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

.form-grid {
  margin-top: 10px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 13px;
}

input,
textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

.full-row {
  margin-top: 10px;
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
  vertical-align: top;
}

th {
  background: #f9fafb;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.pager {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.empty,
.platform-tip {
  color: #6b7280;
  font-size: 14px;
}

.platform-tip {
  margin: 10px 0 0;
}

@media (max-width: 900px) {
  .search-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
