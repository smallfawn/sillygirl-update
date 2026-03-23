<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { queryStorageList, queryStorageOptions, updateStorage } from '../../api/storage'

const state = reactive({
  search: '',
  selectedKeys: [],
  list: [],
  total: 0,
  current: 1,
  pageSize: 20,
  loading: false,
  saving: false,
  message: '',
  error: '',
})

const options = ref([])
const optionLoading = ref(false)

const selectedKeysText = computed(() => state.selectedKeys.join(','))
const hasSelection = computed(() => state.selectedKeys.length > 0)

const pageCount = computed(() => {
  if (!state.total) {
    return 1
  }
  return Math.max(1, Math.ceil(state.total / state.pageSize))
})

let optionTimer = null

watch(
  () => state.search,
  () => {
    clearTimeout(optionTimer)
    optionTimer = setTimeout(() => {
      fetchOptions()
    }, 250)
  },
)

async function fetchOptions() {
  optionLoading.value = true
  try {
    const res = await queryStorageOptions(state.search)
    options.value = Array.isArray(res?.data) ? res.data : []
  } catch (error) {
    state.error = error.message || '获取存储选项失败'
  } finally {
    optionLoading.value = false
  }
}

async function fetchList() {
  if (!hasSelection.value) {
    state.list = []
    state.total = 0
    return
  }

  state.loading = true
  state.message = ''
  state.error = ''
  try {
    const res = await queryStorageList({
      current: state.current,
      pageSize: state.pageSize,
      keys: selectedKeysText.value,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
  } catch (error) {
    state.error = error.message || '查询存储列表失败'
  } finally {
    state.loading = false
  }
}

function addKey(value) {
  if (!value) {
    return
  }
  if (!state.selectedKeys.includes(value)) {
    state.selectedKeys.push(value)
  }
  state.current = 1
  fetchList()
}

function removeKey(value) {
  state.selectedKeys = state.selectedKeys.filter((item) => item !== value)
  state.current = 1
  fetchList()
}

function clearKeys() {
  state.selectedKeys = []
  state.current = 1
  state.list = []
  state.total = 0
}

function updateRowValue(row, event) {
  row.value = event.target.value
}

async function saveRow(row) {
  const key = `${row.bucket}.${row.key}`
  state.saving = true
  state.message = ''
  state.error = ''
  try {
    const res = await updateStorage({ [key]: row.value })
    const change = res?.changes?.[key]
    if (change) {
      state.message = `已保存：${key}`
    } else {
      state.message = `未检测到变更：${key}`
    }
    await fetchList()
  } catch (error) {
    state.error = error.message || '保存失败'
  } finally {
    state.saving = false
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
  if (state.current >= pageCount.value) {
    return
  }
  state.current += 1
  fetchList()
}

fetchOptions()
</script>

<template>
  <section class="storage-page">
    <header class="panel">
      <div class="row">
        <h3>存储管理</h3>
        <span class="hint">已支持 bucket/key 检索、分页展示、单条保存</span>
      </div>

      <div class="search-box">
        <input v-model.trim="state.search" placeholder="搜索 bucket、key、value" />
        <div class="options" v-if="state.search || optionLoading">
          <p v-if="optionLoading" class="empty">搜索中...</p>
          <button
            v-for="item in options"
            :key="item.value"
            class="option-item"
            @click="addKey(item.value)"
          >
            <span>{{ item.text }}</span>
            <code>{{ item.value }}</code>
          </button>
          <p v-if="!optionLoading && !options.length" class="empty">没有匹配项</p>
        </div>
      </div>

      <div class="chips" v-if="state.selectedKeys.length">
        <button v-for="item in state.selectedKeys" :key="item" class="chip" @click="removeKey(item)">
          {{ item }} ×
        </button>
        <button class="clear" @click="clearKeys">清空</button>
      </div>
    </header>

    <section class="panel" v-if="hasSelection">
      <div class="table-head">
        <strong>查询结果</strong>
        <span>共 {{ state.total }} 条，当前第 {{ state.current }} / {{ pageCount }} 页</span>
      </div>

      <p v-if="state.message" class="msg success">{{ state.message }}</p>
      <p v-if="state.error" class="msg error">{{ state.error }}</p>

      <div v-if="state.loading" class="empty">加载中...</div>
      <div v-else-if="!state.list.length" class="empty">暂无数据</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Key</th>
              <th>Value</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in state.list" :key="`${row.bucket}-${row.key}`">
              <td>{{ row.bucket }}</td>
              <td>{{ row.key }}</td>
              <td>
                <textarea :value="row.value" @input="updateRowValue(row, $event)" rows="3" />
              </td>
              <td>
                <button class="save" :disabled="state.saving" @click="saveRow(row)">保存</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pager">
        <button :disabled="state.current <= 1 || state.loading" @click="prevPage">上一页</button>
        <button :disabled="state.current >= pageCount || state.loading" @click="nextPage">下一页</button>
      </footer>
    </section>

    <section class="panel empty" v-else>
      请先通过上方搜索添加至少一个 bucket 或 bucket.key 进行查询。
    </section>
  </section>
</template>

<style scoped>
.storage-page {
  display: grid;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h3 {
  margin: 0;
  color: #111827;
}

.hint {
  font-size: 13px;
  color: #6b7280;
}

.search-box {
  margin-top: 12px;
  position: relative;
}

.search-box input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
}

.options {
  position: absolute;
  z-index: 3;
  top: calc(100% + 6px);
  width: 100%;
  max-height: 240px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.1);
}

.option-item {
  width: 100%;
  border: none;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  text-align: left;
  padding: 10px 12px;
  cursor: pointer;
  display: grid;
  gap: 4px;
}

.option-item:hover {
  background: #f9fafb;
}

.option-item code {
  color: #7c3aed;
}

.chips {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip,
.clear {
  border: none;
  border-radius: 999px;
  padding: 6px 10px;
  cursor: pointer;
}

.chip {
  background: #ede9fe;
  color: #5b21b6;
}

.clear {
  background: #fee2e2;
  color: #b91c1c;
}

.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 12px;
  color: #374151;
  font-size: 14px;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 760px;
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

textarea {
  width: 100%;
  min-width: 260px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
  resize: vertical;
}

.save {
  border: none;
  border-radius: 8px;
  background: #7c3aed;
  color: #fff;
  padding: 8px 12px;
  cursor: pointer;
}

.save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.pager button {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 7px 12px;
  background: #fff;
  cursor: pointer;
}

.pager button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.msg {
  font-size: 13px;
  margin: 8px 0;
}

.msg.success {
  color: #047857;
}

.msg.error {
  color: #b91c1c;
}

.empty {
  color: #6b7280;
  font-size: 14px;
}
</style>
