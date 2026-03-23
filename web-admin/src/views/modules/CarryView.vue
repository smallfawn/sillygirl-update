<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteCarryGroup, queryCarryGroupSelects, queryCarryGroups, saveCarryGroup } from '../../api/carry'

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
  try {
    const res = await queryCarryGroups({
      current: state.current,
      pageSize: state.pageSize,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
  } catch (error) {
    ElMessage.error(error.message || '获取搬运规则失败')
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
    ElMessage.error(error.message || '获取搬运辅助信息失败')
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
    ElMessage.warning('请填写群号(chat_id)')
    return
  }

  state.saving = true
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
    ElMessage.success(`规则已保存：${payload.chat_id}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    state.saving = false
  }
}

async function toggleEnable(item) {
  try {
    const res = await saveCarryGroup({
      chat_id: item.chat_id,
      enable: !item.enable,
    })
    if (!res?.success) {
      throw new Error(res?.errorMessage || '切换启用状态失败')
    }
    ElMessage.success(`${item.chat_id} 已${item.enable ? '停用' : '启用'}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '切换启用状态失败')
  }
}

async function handleDelete(chatId) {
  try {
    await ElMessageBox.confirm(`确定删除搬运规则 ${chatId} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.deletingId = chatId
  try {
    const res = await deleteCarryGroup(chatId)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除失败')
    }
    ElMessage.success(`已删除：${chatId}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    state.deletingId = ''
  }
}

function handlePageChange(page) {
  state.current = page
  fetchList()
}

onMounted(async () => {
  await fetchSelects()
  await fetchList()
})
</script>

<template>
  <section class="carry-page">
    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>消息搬运规则</h3>
          <p class="hint">支持分页查看、新增/编辑、启停与删除。多值字段用英文逗号分隔。</p>
        </div>
        <el-space>
          <el-button text type="primary" @click="resetForm">清空表单</el-button>
          <el-button text :loading="state.loading" @click="fetchList">刷新</el-button>
        </el-space>
      </div>

      <el-form :model="form" label-position="top" :disabled="state.saving">
        <el-row :gutter="12">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="群号(chat_id)">
              <el-input v-model.trim="form.chat_id" placeholder="必填，如 123456" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="群名称">
              <el-input v-model.trim="form.chat_name" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="备注">
              <el-input v-model.trim="form.remark" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="平台">
              <el-select v-model="form.platform" placeholder="选择平台" filterable @change="fetchSelects">
                <el-option v-for="p in state.platforms" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="采集源(from)">
              <el-input v-model.trim="form.fromText" placeholder="多个 chat_id 用逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="工作机器人(bots_id)">
              <el-input
                v-model.trim="form.botsText"
                :placeholder="state.botsOptions.join(',') || '可选，逗号分隔'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="处理脚本(scripts)">
              <el-input
                v-model.trim="form.scriptsText"
                :placeholder="Object.keys(state.scriptsMap).slice(0, 6).join(',') || '脚本uuid逗号分隔'"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="包含词(include)">
              <el-input v-model.trim="form.includeText" placeholder="逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="排除词(exclude)">
              <el-input v-model.trim="form.excludeText" placeholder="逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="白名单(allowed)">
              <el-input v-model.trim="form.allowedText" placeholder="逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-form-item label="黑名单(prohibited)">
              <el-input v-model.trim="form.prohibitedText" placeholder="逗号分隔" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="12" class="switch-row">
          <el-col :xs="12" :sm="6">
            <el-switch v-model="form.in" active-text="采集(In)" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-switch v-model="form.out" active-text="转发(Out)" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-switch v-model="form.enable" active-text="启用" />
          </el-col>
          <el-col :xs="12" :sm="6">
            <el-switch v-model="form.deduplication" active-text="文本去重" />
          </el-col>
        </el-row>

        <el-space style="margin-top: 8px">
          <el-button type="primary" :loading="state.saving" @click="submitGroup">保存规则</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-space>
      </el-form>
    </el-card>

    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>规则列表</h3>
          <p class="hint">共 {{ state.total }} 条</p>
        </div>
        <el-button text :loading="state.loading" @click="fetchList">刷新</el-button>
      </div>

      <el-table :data="state.list" stripe v-loading="state.loading" style="width: 100%">
        <el-table-column prop="chat_id" label="群号" width="150" />
        <el-table-column prop="chat_name" label="名称" width="180">
          <template #default="{ row }">
            {{ row.chat_name || state.groupNames[row.chat_id] || row.remark || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="platform" label="平台" width="100" />
        <el-table-column label="方向" width="120">
          <template #default="{ row }">
            {{ row.in ? '采集' : '' }}{{ row.in && row.out ? ' / ' : '' }}{{ row.out ? '转发' : '' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enable ? 'success' : 'info'" @click="toggleEnable(row)" style="cursor: pointer">
              {{ row.enable ? '已启用' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="采集源" width="160">
          <template #default="{ row }">{{ Array.isArray(row.from) && row.from.length ? row.from.join(',') : '-' }}</template>
        </el-table-column>
        <el-table-column label="脚本" width="160">
          <template #default="{ row }">{{ Array.isArray(row.scripts) && row.scripts.length ? row.scripts.join(',') : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-space>
              <el-button size="small" @click="editGroup(row)">编辑</el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :loading="state.deletingId === row.chat_id"
                @click="handleDelete(row.chat_id)"
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
.carry-page {
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

.switch-row {
  margin-top: 4px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
