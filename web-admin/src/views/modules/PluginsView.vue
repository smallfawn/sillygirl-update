<script setup>
import { computed, onMounted, reactive } from 'vue'
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
  message: '',
  error: '',
})

const pageCount = computed(() => Math.max(1, Math.ceil((state.total || 0) / state.pageSize)))

const classOptions = computed(() => {
  const entries = Object.entries(state.classes || {})
  const sorted = entries.sort((a, b) => {
    if (a[0] === '全部') return -1
    if (b[0] === '全部') return 1
    return b[1] - a[1]
  })
  return sorted
})

const originOptions = computed(() => Object.keys(state.origins || {}))

function statusText(item) {
  if (item?.status === 6) return '公开'
  if (item?.status === 2) return '已安装'
  if (item?.status === 1) return '可更新'
  return '未安装'
}

function statusClass(item) {
  if (item?.status === 6) return 'status-public'
  if (item?.status === 2) return 'status-installed'
  if (item?.status === 1) return 'status-updatable'
  return 'status-not-installed'
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
  if (canUpdate(item)) {
    return '更新'
  }
  if (canInstall(item)) {
    return '安装'
  }
  return '已安装'
}

function mapList(raw) {
  if (!Array.isArray(raw)) {
    return []
  }
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
  state.error = ''

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
    state.error = error.message || '获取插件列表失败'
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
  if (state.activeKey === tab) {
    return
  }
  state.activeKey = tab
  state.current = 1
  fetchList()
}

function handleClassChange(event) {
  state.selectedClass = event.target.value
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

function getStorageError(res, key) {
  if (!res?.errors) {
    return ''
  }
  return res.errors[key] || ''
}

async function handleInstall(item) {
  const uuid = item.id
  if (!uuid || !canInstall(item) && !canUpdate(item)) {
    return
  }

  const action = canUpdate(item) ? '更新' : '安装'
  if (!window.confirm(`确定${action}插件「${item.title || uuid}」吗？`)) {
    return
  }

  state.operatingId = uuid
  state.error = ''
  state.message = ''
  try {
    const res = await installPlugin(uuid)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) {
      throw new Error(err)
    }
    state.message = `已触发${action}：${item.title || uuid}`
    await fetchList()
  } catch (error) {
    state.error = error.message || `${action}失败`
  } finally {
    state.operatingId = ''
  }
}

async function handleUninstall(item) {
  const uuid = item.id
  if (!uuid || !canUninstall(item)) {
    return
  }
  if (!window.confirm(`确定卸载插件「${item.title || uuid}」吗？卸载后将停止该插件功能。`)) {
    return
  }
  state.operatingId = uuid
  state.error = ''
  state.message = ''
  try {
    const res = await uninstallPlugin(uuid)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) {
      throw new Error(err)
    }
    state.message = `已卸载：${item.title || uuid}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '卸载失败'
  } finally {
    state.operatingId = ''
  }
}

async function handleToggleDisable(item) {
  const uuid = item.id
  if (!uuid || !canToggleSwitch(item)) {
    return
  }

  const target = !item.disable
  const action = target ? '禁用' : '启用'
  if (!window.confirm(`确定${action}插件「${item.title || uuid}」吗？`)) {
    return
  }

  state.operatingId = uuid
  state.error = ''
  state.message = ''
  try {
    const res = await setPluginDisable(uuid, target)
    const key = `plugin_disable.${uuid}`
    const err = getStorageError(res, key)
    if (err) {
      throw new Error(err)
    }
    state.message = target ? `已禁用：${item.title || uuid}` : `已启用：${item.title || uuid}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '更新禁用状态失败'
  } finally {
    state.operatingId = ''
  }
}

async function handleToggleDebug(item) {
  const uuid = item.id
  if (!uuid || !canToggleSwitch(item)) {
    return
  }

  const target = !item.debug
  const action = target ? '开启调试' : '关闭调试'
  if (!window.confirm(`确定${action}「${item.title || uuid}」吗？`)) {
    return
  }

  state.operatingId = uuid
  state.error = ''
  state.message = ''
  try {
    const res = await setPluginDebug(uuid, target)
    const key = `plugin_debug.${uuid}`
    const err = getStorageError(res, key)
    if (err) {
      throw new Error(err)
    }
    state.message = target ? `已开启调试：${item.title || uuid}` : `已关闭调试：${item.title || uuid}`
    await fetchList()
  } catch (error) {
    state.error = error.message || '更新调试状态失败'
  } finally {
    state.operatingId = ''
  }
}

onMounted(() => fetchList(true))
</script>

<template>
  <section class="plugins-page">
    <section class="panel">
      <div class="head-row">
        <h3>插件市场</h3>
        <button :disabled="state.loading" @click="fetchList">刷新</button>
      </div>
      <p class="hint">支持按关键词、分类、来源筛选，并可进行安装、卸载、禁用和调试切换。</p>

      <div class="tabs">
        <button :class="{ active: state.activeKey === 'tab1' }" @click="switchTab('tab1')">
          已安装 ({{ state.tab1 }})
        </button>
        <button :class="{ active: state.activeKey === 'tab2' }" @click="switchTab('tab2')">
          可安装 ({{ state.tab2 }})
        </button>
        <button :class="{ active: state.activeKey === 'tab3' }" @click="switchTab('tab3')">
          可更新 ({{ state.tab3 }})
        </button>
      </div>

      <div class="filters">
        <label>
          关键词
          <input v-model.trim="state.keyword" placeholder="插件名/来源关键词" @keyup.enter="fetchList" />
        </label>
        <label>
          分类
          <select :value="state.selectedClass" @change="handleClassChange">
            <option v-for="entry in classOptions" :key="entry[0]" :value="entry[0]">
              {{ entry[0] }} ({{ entry[1] }})
            </option>
          </select>
        </label>
      </div>

      <div class="origin-group" v-if="originOptions.length">
        <span>来源：</span>
        <label v-for="origin in originOptions" :key="origin" class="origin-item">
          <input
            type="checkbox"
            :checked="state.selectedOrigins.includes(origin)"
            @change="toggleOrigin(origin, $event.target.checked)"
          />
          {{ origin }}
        </label>
      </div>

      <div class="actions">
        <button class="primary" :disabled="state.loading" @click="state.current = 1; fetchList()">查询</button>
        <button :disabled="state.loading" @click="resetFilter">重置</button>
      </div>

      <p v-if="state.message" class="msg success">{{ state.message }}</p>
      <p v-if="state.error" class="msg error">{{ state.error }}</p>
    </section>

    <section class="panel">
      <div class="table-head">
        <strong>插件列表</strong>
        <span>共 {{ state.total }} 条，当前第 {{ state.current }} / {{ pageCount }} 页</span>
      </div>

      <div v-if="state.loading" class="empty">加载中...</div>
      <div v-else-if="!state.list.length" class="empty">暂无插件数据</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>作者/来源</th>
              <th>版本</th>
              <th>分类</th>
              <th>状态</th>
              <th>运行</th>
              <th>说明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in state.list" :key="item.id">
              <td>
                <div class="title-cell">
                  <img v-if="item.icon" :src="item.icon" alt="icon" class="icon" />
                  <div>
                    <strong>{{ item.title || item.id }}</strong>
                    <p class="sub">ID: {{ item.id }}</p>
                  </div>
                </div>
              </td>
              <td>
                <div>{{ item.author || '-' }}</div>
                <p class="sub">{{ item.organization || '-' }}</p>
              </td>
              <td>{{ item.version || '-' }}</td>
              <td>{{ item.classes.length ? item.classes.join(' / ') : '未分类' }}</td>
              <td><span :class="['status-tag', statusClass(item)]">{{ statusText(item) }}</span></td>
              <td>{{ item.running ? '运行中' : '未运行' }}</td>
              <td>{{ item.description || '-' }}</td>
              <td>
                <div class="row-actions">
                  <button
                    v-if="canInstall(item) || canUpdate(item)"
                    class="primary"
                    :disabled="state.operatingId === item.id"
                    @click="handleInstall(item)"
                  >
                    {{ state.operatingId === item.id ? '处理中...' : operationText(item) }}
                  </button>
                  <button v-else disabled>已安装</button>

                  <button
                    v-if="canUninstall(item)"
                    :disabled="state.operatingId === item.id"
                    @click="handleUninstall(item)"
                  >
                    卸载
                  </button>
                  <button v-else disabled>不可卸载</button>

                  <button
                    :disabled="state.operatingId === item.id || !canToggleSwitch(item)"
                    @click="handleToggleDisable(item)"
                  >
                    {{ item.disable ? '启用' : '禁用' }}
                  </button>
                  <button
                    :disabled="state.operatingId === item.id || !canToggleSwitch(item)"
                    @click="handleToggleDebug(item)"
                  >
                    {{ item.debug ? '关闭调试' : '开启调试' }}
                  </button>
                </div>
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
  </section>
</template>

<style scoped>
.plugins-page {
  display: grid;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
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

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tabs button.active {
  border-color: #7c3aed;
  color: #7c3aed;
  background: #f5f3ff;
}

.filters {
  margin-top: 12px;
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
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

.origin-group {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  color: #374151;
}

.origin-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
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
  min-width: 1200px;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
  vertical-align: top;
  color: #1f2937;
  font-size: 13px;
}

.title-cell {
  display: flex;
  gap: 8px;
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

.sub {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.status-tag {
  display: inline-block;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
}

.status-installed {
  color: #047857;
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.status-updatable {
  color: #92400e;
  border-color: #fde68a;
  background: #fffbeb;
}

.status-public {
  color: #1d4ed8;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.status-not-installed {
  color: #6b7280;
}

.row-actions {
  display: grid;
  gap: 6px;
}

.empty {
  padding: 20px 10px;
  text-align: center;
  color: #6b7280;
}

.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 900px) {
  .filters {
    grid-template-columns: 1fr;
  }
}
</style>
