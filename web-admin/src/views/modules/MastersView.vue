<script setup>
import { computed, onMounted, reactive } from 'vue'
import { addMaster, queryMasters, removeMaster } from '../../api/masters'

const state = reactive({
  loading: false,
  saving: false,
  deletingKey: '',
  list: [],
  platforms: [],
  search: '',
  message: '',
  error: '',
})

const form = reactive({
  number: '',
  platform: '',
})

const filteredList = computed(() => {
  const keyword = state.search.trim()
  if (!keyword) {
    return state.list
  }
  return state.list.filter((item) => {
    return [item.number, item.platform, item.nickname].some((v) => (v || '').includes(keyword))
  })
})

async function fetchMasters() {
  state.loading = true
  state.error = ''
  try {
    const res = await queryMasters()
    state.list = Array.isArray(res?.data) ? res.data : []
    state.platforms = Array.isArray(res?.platforms) ? res.platforms : []
    if (!form.platform && state.platforms.length) {
      const defaultPlt = state.platforms[0]
      form.platform = defaultPlt?.value || defaultPlt?.platform || ''
    }
  } catch (error) {
    state.error = error.message || '获取管理员列表失败'
  } finally {
    state.loading = false
  }
}

async function submitMaster() {
  if (!form.number) {
    state.error = '请填写管理员号码'
    return
  }

  state.saving = true
  state.error = ''
  state.message = ''
  try {
    const payload = {
      number: form.number,
      platform: form.platform,
    }
    const res = await addMaster(payload)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '新增管理员失败')
    }
    state.message = `已添加管理员：${form.number}`
    form.number = ''
    await fetchMasters()
  } catch (error) {
    state.error = error.message || '新增管理员失败'
  } finally {
    state.saving = false
  }
}

async function handleDelete(item) {
  const key = `${item.platform}:${item.number}`
  if (!window.confirm(`确定删除管理员 ${key} 吗？`)) {
    return
  }

  state.deletingKey = key
  state.error = ''
  state.message = ''
  try {
    const res = await removeMaster({
      number: item.number,
      platform: item.platform,
    })
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除管理员失败')
    }
    state.message = `已删除管理员：${key}`
    await fetchMasters()
  } catch (error) {
    state.error = error.message || '删除管理员失败'
  } finally {
    state.deletingKey = ''
  }
}

onMounted(fetchMasters)
</script>

<template>
  <section class="masters-page">
    <section class="panel">
      <h3>管理员配置</h3>
      <p class="hint">支持管理员查询、新增和删除。平台可选，不填时后端会尝试根据昵称数据推断。</p>

      <div class="toolbar">
        <label>
          搜索
          <input v-model.trim="state.search" placeholder="按号码、平台、昵称过滤" />
        </label>
      </div>

      <div class="form-grid">
        <label>
          管理员号码
          <input v-model.trim="form.number" placeholder="必填，例如 123456" />
        </label>
        <label>
          平台
          <select v-model="form.platform">
            <option value="">自动识别</option>
            <option
              v-for="item in state.platforms"
              :key="item.value || item.platform || item"
              :value="item.value || item.platform || item"
            >
              {{ item.label || item.platform || item.value || item }}
            </option>
          </select>
        </label>
      </div>

      <div class="actions">
        <button class="primary" :disabled="state.saving" @click="submitMaster">
          {{ state.saving ? '添加中...' : '添加管理员' }}
        </button>
      </div>

      <p v-if="state.message" class="msg success">{{ state.message }}</p>
      <p v-if="state.error" class="msg error">{{ state.error }}</p>
    </section>

    <section class="panel">
      <div class="table-head">
        <strong>管理员列表</strong>
        <span>共 {{ filteredList.length }} 条</span>
      </div>

      <div v-if="state.loading" class="empty">加载中...</div>
      <div v-else-if="!filteredList.length" class="empty">暂无管理员记录</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>平台</th>
              <th>号码</th>
              <th>昵称</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredList" :key="`${item.platform}-${item.number}`">
              <td>{{ item.id }}</td>
              <td>{{ item.platform || '-' }}</td>
              <td>{{ item.number }}</td>
              <td>{{ item.nickname || '-' }}</td>
              <td>
                <button
                  class="danger"
                  :disabled="state.deletingKey === `${item.platform}:${item.number}`"
                  @click="handleDelete(item)"
                >
                  {{ state.deletingKey === `${item.platform}:${item.number}` ? '删除中' : '删除' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<style scoped>
.masters-page {
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

.toolbar {
  margin-bottom: 10px;
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

.form-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(200px, 1fr));
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
  min-width: 700px;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
}

th {
  background: #f9fafb;
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
