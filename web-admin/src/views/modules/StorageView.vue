<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
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
})

const options = ref([])
const optionLoading = ref(false)

const selectedKeysText = computed(() => state.selectedKeys.join(','))
const hasSelection = computed(() => state.selectedKeys.length > 0)

const pageCount = computed(() => {
  if (!state.total) return 1
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
    ElMessage.error(error.message || '获取存储选项失败')
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
  try {
    const res = await queryStorageList({
      current: state.current,
      pageSize: state.pageSize,
      keys: selectedKeysText.value,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
  } catch (error) {
    ElMessage.error(error.message || '查询存储列表失败')
  } finally {
    state.loading = false
  }
}

function addKey(value) {
  if (!value) return
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

async function saveRow(row) {
  const key = `${row.bucket}.${row.key}`
  state.saving = true
  try {
    const res = await updateStorage({ [key]: row.value })
    const change = res?.changes?.[key]
    if (change) {
      ElMessage.success(`已保存：${key}`)
    } else {
      ElMessage.info(`未检测到变更：${key}`)
    }
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    state.saving = false
  }
}

function prevPage() {
  if (state.current <= 1) return
  state.current -= 1
  fetchList()
}

function nextPage() {
  if (state.current >= pageCount.value) return
  state.current += 1
  fetchList()
}

fetchOptions()
</script>

<template>
  <section class="storage-page">
    <el-card shadow="never" class="panel">
      <div class="panel-header">
        <div>
          <h3>存储管理</h3>
          <p class="hint">支持 bucket/key 检索、分页展示、单条保存</p>
        </div>
      </div>

      <el-row :gutter="12" class="search-row">
        <el-col :xs="24" :sm="12" :md="10">
          <el-input
            v-model.trim="state.search"
            placeholder="搜索 bucket、key、value"
            clearable
            :loading="optionLoading"
          />
          <el-card v-if="state.search" class="option-card" shadow="hover">
            <template v-if="optionLoading">
              <div class="empty">搜索中...</div>
            </template>
            <template v-else>
              <div v-if="!options.length" class="empty">没有匹配项</div>
              <el-space wrap v-else>
                <el-tag
                  v-for="item in options"
                  :key="item.value"
                  type="success"
                  effect="light"
                  class="option-tag"
                  @click="addKey(item.value)"
                >
                  <span>{{ item.text }}</span>
                  <code>{{ item.value }}</code>
                </el-tag>
              </el-space>
            </template>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="14">
          <el-space wrap v-if="state.selectedKeys.length">
            <el-tag v-for="item in state.selectedKeys" :key="item" closable @close="removeKey(item)">
              {{ item }}
            </el-tag>
            <el-button text type="primary" @click="clearKeys">清空</el-button>
          </el-space>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-if="hasSelection" shadow="never" class="panel">
      <div class="table-head">
        <strong>查询结果</strong>
        <span>共 {{ state.total }} 条，当前第 {{ state.current }} / {{ pageCount }} 页</span>
      </div>

      <el-table :data="state.list" stripe style="width: 100%" v-loading="state.loading">
        <el-table-column prop="bucket" label="Bucket" width="160" />
        <el-table-column prop="key" label="Key" width="260" />
        <el-table-column label="Value">
          <template #default="{ row }">
            <el-input
              v-model="row.value"
              type="textarea"
              :rows="2"
              autosize
              placeholder="请输入 value"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" size="small" :loading="state.saving" @click="saveRow(row)">
              保存
            </el-button>
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
          @current-change="(p) => { state.current = p; fetchList() }"
        />
      </div>
    </el-card>

    <el-empty v-else description="请先搜索并选择 Bucket/Key" />
  </section>
</template>

<style scoped>
.storage-page {
  display: grid;
  gap: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 18px;
}

.hint {
  margin: 4px 0 0;
  color: #6b7280;
}

.search-row {
  margin-top: 12px;
}

.option-card {
  margin-top: 8px;
}

.option-tag {
  cursor: pointer;
}

.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>

