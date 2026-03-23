<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addMaster, queryMasters, removeMaster } from '../../api/masters'

const state = reactive({
  loading: false,
  saving: false,
  deletingKey: '',
  list: [],
  platforms: [],
  search: '',
})

const form = reactive({
  number: '',
  platform: '',
})

async function fetchMasters() {
  state.loading = true
  try {
    const res = await queryMasters()
    state.list = Array.isArray(res?.data) ? res.data : []
    state.platforms = Array.isArray(res?.platforms) ? res.platforms : []
    if (!form.platform && state.platforms.length) {
      const defaultPlt = state.platforms[0]
      form.platform = defaultPlt?.value || defaultPlt?.platform || ''
    }
  } catch (error) {
    ElMessage.error(error.message || '获取管理员列表失败')
  } finally {
    state.loading = false
  }
}

async function submitMaster() {
  if (!form.number) {
    ElMessage.warning('请填写管理员号码')
    return
  }

  state.saving = true
  try {
    const payload = { number: form.number, platform: form.platform }
    const res = await addMaster(payload)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '新增管理员失败')
    }
    ElMessage.success(`已添加管理员：${form.number}`)
    form.number = ''
    await fetchMasters()
  } catch (error) {
    ElMessage.error(error.message || '新增管理员失败')
  } finally {
    state.saving = false
  }
}

async function handleDelete(item) {
  const key = `${item.platform}:${item.number}`
  try {
    await ElMessageBox.confirm(`确定删除管理员 ${key} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.deletingKey = key
  try {
    const res = await removeMaster({ number: item.number, platform: item.platform })
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除管理员失败')
    }
    ElMessage.success(`已删除管理员：${key}`)
    await fetchMasters()
  } catch (error) {
    ElMessage.error(error.message || '删除管理员失败')
  } finally {
    state.deletingKey = ''
  }
}

function filteredList() {
  const keyword = state.search.trim()
  if (!keyword) return state.list
  return state.list.filter((item) => [item.number, item.platform, item.nickname].some((v) => (v || '').includes(keyword)))
}

onMounted(fetchMasters)
</script>

<template>
  <section class="masters-page">
    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>管理员配置</h3>
          <p class="hint">支持查询、新增和删除。平台可选，不填时后端会尝试根据昵称推断。</p>
        </div>
        <el-space>
          <el-button text :loading="state.loading" @click="fetchMasters">刷新</el-button>
        </el-space>
      </div>

      <el-row :gutter="12" class="search-row">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input v-model.trim="state.search" placeholder="按号码、平台、昵称过滤" clearable />
        </el-col>
      </el-row>

      <el-form :model="form" label-position="top" :disabled="state.saving" class="form-area">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12">
            <el-form-item label="管理员号码">
              <el-input v-model.trim="form.number" placeholder="必填，例如 123456" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="平台">
              <el-select v-model="form.platform" placeholder="自动识别" clearable>
                <el-option label="自动识别" value="" />
                <el-option
                  v-for="item in state.platforms"
                  :key="item.value || item.platform || item"
                  :label="item.label || item.platform || item.value || item"
                  :value="item.value || item.platform || item"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-space>
          <el-button type="primary" :loading="state.saving" @click="submitMaster">添加管理员</el-button>
          <el-button @click="form.number = ''; form.platform = state.platforms[0]?.value || state.platforms[0]?.platform || ''">
            重置
          </el-button>
        </el-space>
      </el-form>
    </el-card>

    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>管理员列表</h3>
          <p class="hint">共 {{ filteredList().length }} 条</p>
        </div>
      </div>

      <el-table :data="filteredList()" stripe v-loading="state.loading" style="width: 100%">
        <el-table-column prop="id" label="#" width="60" />
        <el-table-column prop="platform" label="平台" width="120" />
        <el-table-column prop="number" label="号码" width="160" />
        <el-table-column prop="nickname" label="昵称" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              type="danger"
              plain
              :loading="state.deletingKey === `${row.platform}:${row.number}`"
              @click="handleDelete(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<style scoped>
.masters-page {
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

.search-row {
  margin: 6px 0 4px;
}

.form-area {
  margin-top: 8px;
}
</style>
