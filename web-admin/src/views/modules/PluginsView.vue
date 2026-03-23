<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  installPlugin,
  queryPluginList,
  setPluginDebug,
  setPluginDisable,
  uninstallPlugin,
} from '../../api/plugins'

const state = reactive({
  loading: false,
  operatingId: '',
  current: 1,
  pageSize: 10,
  total: 0,
  list: [],
  activeKey: 'tab1',
  keyword: '',
  selectedClass: '全部',
  selectedOrigins: [],
  classes: {},
  origins: {},
  tab1: 0,
  tab2: 0,
  tab3: 0,
})

const pageCount = () => Math.max(1, Math.ceil((state.total || 0) / state.pageSize))

const classOptions = () => {
  const entries = Object.entries(state.classes || {})
  const sorted = entries.sort((a, b) => {
    if (a[0] === '全部') return -1
    if (b[0] === '全部') return 1
    return b[1] - a[1]
  })
  return sorted
}

const originOptions = () => Object.keys(state.origins || {})

function statusText(item) {
  if (item?.status === 6) return '公开'
  if (item?.status === 2) return '已安装'
  if (item?.status === 1) return '可更新'
  return '未安装'
}

function statusTagType(item) {
  if (item?.status === 6) return 'success'
  if (item?.status === 2) return 'info'
  if (item?.status === 1) return 'warning'
  return 'default'
}

function isInstalled(item) {
  return item?.status === 2 || item?.status === 6 || item?.status === 1
}

function canInstall(item) {
  return !isInstalled(item)
}

function canUpdate(item) {
  return item?.status === 1
}

function canUninstall(item) {
  return isInstalled(item)
}

function canToggleSwitch(item) {
  return isInstalled(item)
}

function operationText(item) {
  if (canUpdate(item)) return '更新'
  if (canInstall(item)) return '安装'
  return '已安装'
}

function mapList(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => ({
    ...item,
    id: item.id || item.uuid,
    classes: Array.isArray(item.classes) ? item.classes : [],
    disable: Boolean(item.disable),
    debug: Boolean(item.debug),
    running: Boolean(item.running),
  }))
}

async function fetchList(init = false) {
  state.loading = true
  try {
    const params = {
      current: state.current,
      pageSize: state.pageSize,
      activeKey: state.activeKey,
      keyword: state.keyword,
      class: state.selectedClass,
      init: init ? 'true' : 'false',
    }
    if (state.selectedOrigins.length) {
      params['origin[]'] = state.selectedOrigins
    }
    const res = await queryPluginList(params)
    state.list = mapList(res?.data)
    state.total = Number(res?.total || 0)
    state.tab1 = Number(res?.tab1 || 0)
    state.tab2 = Number(res?.tab2 || 0)
    state.tab3 = Number(res?.tab3 || 0)
    state.classes = res?.classes || {}
    state.origins = res?.origins || {}
  } catch (error) {
    ElMessage.error(error.message || '获取插件列表失败')
  } finally {
    state.loading = false
  }
}

function resetFilter() {
  state.keyword = ''
  state.selectedClass = '全部'
  state.selectedOrigins = []
  state.current = 1
  fetchList()
}

function switchTab(tab) {
  if (state.activeKey === tab) return
  state.activeKey = tab
  state.current = 1
  fetchList()
}

function handleClassChange(val) {
  state.selectedClass = val
  state.current = 1
  fetchList()
}

function toggleOrigin(origin, checked) {
  if (checked) {
    if (!state.selectedOrigins.includes(origin)) {
      state.selectedOrigins.push(origin)
    }
  } else {
    state.selectedOrigins = state.selectedOrigins.filter((item) => item !== origin)
  }
  state.current = 1
  fetchList()
}

function handlePageChange(page) {
  state.current = page
  fetchList()
}

function getStorageError(res, key) {
  if (!res?.errors) return ''
  return res.errors[key] || ''
}

async function handleInstall(item) {
  const uuid = item.id
  if (!uuid || (!canInstall(item) && !canUpdate(item))) return
  const action = canUpdate(item) ? '更新' : '安装'
  try {
    await ElMessageBox.confirm(`确定${action}插件「${item.title || uuid}」吗？`, '确认', {
      type: 'warning',
      confirmButtonText: action,
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.operatingId = uuid
  try {
    const res = await installPlugin(uuid)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) throw new Error(err)
    ElMessage.success(`已触发${action}：${item.title || uuid}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || `${action}失败`)
  } finally {
    state.operatingId = ''
  }
}

async function handleUninstall(item) {
  const uuid = item.id
  if (!uuid || !canUninstall(item)) return
  try {
    await ElMessageBox.confirm(`确定卸载插件「${item.title || uuid}」吗？卸载后将停止该插件功能。`, '确认', {
      type: 'warning',
      confirmButtonText: '卸载',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.operatingId = uuid
  try {
    const res = await uninstallPlugin(uuid)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) throw new Error(err)
    ElMessage.success(`已卸载：${item.title || uuid}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '卸载失败')
  } finally {
    state.operatingId = ''
  }
}

async function handleToggleDisable(item) {
  const uuid = item.id
  if (!uuid || !canToggleSwitch(item)) return
  const target = !item.disable
  const action = target ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}插件「${item.title || uuid}」吗？`, '确认', {
      type: 'warning',
      confirmButtonText: action,
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.operatingId = uuid
  try {
    const res = await setPluginDisable(uuid, target)
    const key = `plugin_disable.${uuid}`
    const err = getStorageError(res, key)
    if (err) throw new Error(err)
    ElMessage.success(target ? `已禁用：${item.title || uuid}` : `已启用：${item.title || uuid}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '更新禁用状态失败')
  } finally {
    state.operatingId = ''
  }
}

async function handleToggleDebug(item) {
  const uuid = item.id
  if (!uuid || !canToggleSwitch(item)) return
  const target = !item.debug
  const action = target ? '开启调试' : '关闭调试'
  try {
    await ElMessageBox.confirm(`确定${action}「${item.title || uuid}」吗？`, '确认', {
      type: 'warning',
      confirmButtonText: action,
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.operatingId = uuid
  try {
    const res = await setPluginDebug(uuid, target)
    const key = `plugin_debug.${uuid}`
    const err = getStorageError(res, key)
    if (err) throw new Error(err)
    ElMessage.success(target ? `已开启调试：${item.title || uuid}` : `已关闭调试：${item.title || uuid}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '更新调试状态失败')
  } finally {
    state.operatingId = ''
  }
}

onMounted(() => fetchList(true))
</script>

<template>
  <section class="plugins-page">
    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>插件市场</h3>
          <p class="hint">支持按关键词、分类、来源筛选，并可安装/卸载/禁用/调试。</p>
        </div>
        <el-space>
          <el-button text :loading="state.loading" @click="fetchList">刷新</el-button>
        </el-space>
      </div>

      <el-tabs v-model="state.activeKey" @tab-change="(tab) => switchTab(tab)">
        <el-tab-pane :label="`已安装 (${state.tab1})`" name="tab1" />
        <el-tab-pane :label="`可安装 (${state.tab2})`" name="tab2" />
        <el-tab-pane :label="`可更新 (${state.tab3})`" name="tab3" />
      </el-tabs>

      <el-row :gutter="12" class="filters">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model.trim="state.keyword"
            placeholder="插件名/来源关键词"
            clearable
            @keyup.enter="() => { state.current = 1; fetchList() }"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-select :model-value="state.selectedClass" placeholder="分类" clearable @change="handleClassChange">
            <el-option v-for="entry in classOptions()" :key="entry[0]" :value="entry[0]">
              {{ entry[0] }} ({{ entry[1] }})
            </el-option>
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8" v-if="originOptions().length">
          <div class="origin-group">
            <span class="origin-label">来源：</span>
            <el-checkbox-group v-model="state.selectedOrigins" @change="() => { state.current = 1; fetchList() }">
              <el-checkbox v-for="origin in originOptions()" :key="origin" :label="origin">{{ origin }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </el-col>
      </el-row>

      <el-space style="margin-top: 8px">
        <el-button type="primary" :loading="state.loading" @click="state.current = 1; fetchList()">查询</el-button>
        <el-button @click="resetFilter" :disabled="state.loading">重置</el-button>
      </el-space>
    </el-card>

    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>插件列表</h3>
          <p class="hint">共 {{ state.total }} 条，当前第 {{ state.current }} / {{ pageCount() }} 页</p>
        </div>
      </div>

      <el-table :data="state.list" stripe v-loading="state.loading" style="width: 100%">
        <el-table-column label="名称" min-width="220">
          <template #default="{ row }">
            <div class="title-cell">
              <img v-if="row.icon" :src="row.icon" alt="icon" class="icon" />
              <div>
                <strong>{{ row.title || row.id }}</strong>
                <p class="sub">ID: {{ row.id }}</p>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="作者/来源" min-width="160">
          <template #default="{ row }">
            <div>{{ row.author || '-' }}</div>
            <p class="sub">{{ row.organization || '-' }}</p>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column label="分类" min-width="160">
          <template #default="{ row }">
            {{ row.classes.length ? row.classes.join(' / ') : '未分类' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row)">{{ statusText(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="running" label="运行" width="90">
          <template #default="{ row }">
            <el-tag :type="row.running ? 'success' : 'info'">{{ row.running ? '运行中' : '未运行' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-space wrap>
              <el-button
                v-if="canInstall(row) || canUpdate(row)"
                size="small"
                type="primary"
                plain
                :loading="state.operatingId === row.id"
                @click="handleInstall(row)"
              >{{ operationText(row) }}</el-button>
              <el-button
                v-if="canUninstall(row)"
                size="small"
                type="danger"
                plain
                :loading="state.operatingId === row.id"
                @click="handleUninstall(row)"
              >卸载</el-button>
              <el-button
                v-if="canToggleSwitch(row)"
                size="small"
                type="warning"
                plain
                :loading="state.operatingId === row.id"
                @click="handleToggleDisable(row)"
              >{{ row.disable ? '启用' : '禁用' }}</el-button>
              <el-button
                v-if="canToggleSwitch(row)"
                size="small"
                type="info"
                plain
                :loading="state.operatingId === row.id"
                @click="handleToggleDebug(row)"
              >{{ row.debug ? '关闭调试' : '开启调试' }}</el-button>
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
.plugins-page {
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

.filters {
  margin-top: 8px;
}

.origin-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.origin-label {
  color: #475569;
}

.title-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
}

.sub {
  margin: 0;
  color: #6b7280;
  font-size: 12px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
