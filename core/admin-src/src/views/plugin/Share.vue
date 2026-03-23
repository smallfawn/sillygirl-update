<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span style="font-weight: 600; font-size: 16px;">插件市场</span>
      </template>

      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索插件"
          style="width: 250px;"
          clearable
          @clear="loadPlugins"
          @keyup.enter="loadPlugins"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="selectedClass" placeholder="分类" style="width: 140px;" @change="loadPlugins">
          <el-option v-for="(count, cls) in classes" :key="cls" :label="`${cls} (${count})`" :value="cls" />
        </el-select>
        <el-select v-model="selectedOrigin" placeholder="来源" style="width: 160px;" clearable @change="loadPlugins">
          <el-option v-for="origin in origins" :key="origin" :label="origin" :value="origin" />
        </el-select>
      </div>

      <el-tabs v-model="activeTab" @tab-change="loadPlugins">
        <el-tab-pane :label="`已安装 (${tabCounts.tab1 || 0})`" name="tab1" />
        <el-tab-pane :label="`未安装 (${tabCounts.tab2 || 0})`" name="tab2" />
        <el-tab-pane :label="`有更新 (${tabCounts.tab3 || 0})`" name="tab3" />
      </el-tabs>

      <div v-loading="loading">
        <div class="card-list" v-if="plugins.length > 0">
          <el-card v-for="(plugin, idx) in plugins" :key="idx" shadow="hover" class="plugin-card">
            <div class="plugin-info">
              <div class="plugin-title">
                <el-tag size="small" type="success" v-if="plugin.installed !== undefined">已安装</el-tag>
                <el-tag size="small" type="warning" v-if="plugin.update !== undefined">可升级</el-tag>
                <span class="plugin-name">{{ plugin.title || plugin.name || '未命名插件' }}</span>
              </div>
              <div class="plugin-desc">{{ plugin.description || '暂无描述' }}</div>
              <div class="plugin-meta">
                <span v-if="plugin.organization">
                  <el-icon><OfficeBuilding /></el-icon> {{ plugin.organization }}
                </span>
                <span v-if="plugin.version">v{{ plugin.version }}</span>
              </div>
              <div class="plugin-actions">
                <el-button
                  v-if="plugin.installed !== undefined"
                  type="danger"
                  size="small"
                  @click="handleUninstall(plugin)"
                >卸载</el-button>
                <el-button
                  v-if="plugin.update !== undefined"
                  type="warning"
                  size="small"
                  @click="handleUpgrade(plugin)"
                >升级</el-button>
                <el-button
                  v-else-if="plugin.installed === undefined"
                  type="primary"
                  size="small"
                  @click="handleInstall(plugin)"
                >安装</el-button>
                <el-button
                  v-if="plugin.installed !== undefined"
                  size="small"
                  @click="handleToggleEnable(plugin)"
                >
                  {{ plugin.enabled !== false ? '禁用' : '启用' }}
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
        <el-empty v-else description="暂无插件" />
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="current"
          :page-size="10"
          :total="total"
          layout="prev, pager, next"
          @current-change="loadPlugins"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, OfficeBuilding } from '@element-plus/icons-vue'
import { getPluginList } from '@/api/plugin'
import { updateStorage } from '@/api/storage'

const loading = ref(false)
const keyword = ref('')
const activeTab = ref('tab1')
const selectedClass = ref('全部')
const selectedOrigin = ref('')
const classes = ref<Record<string, number>>({})
const origins = ref<string[]>([])
const plugins = ref<any[]>([])
const current = ref(1)
const total = ref(0)
const tabCounts = ref<Record<string, number>>({})

async function loadPlugins() {
  loading.value = true
  try {
    const res: any = await getPluginList({
      current: current.value,
      pageSize: 10,
      activeKey: activeTab.value,
      keyword: keyword.value || undefined,
      class: selectedClass.value !== '全部' ? selectedClass.value : undefined,
      origin: selectedOrigin.value ? [selectedOrigin.value] : undefined,
    })
    plugins.value = res.data || []
    total.value = res.total || 0
    tabCounts.value = { tab1: res.tab1, tab2: res.tab2, tab3: res.tab3 }
    classes.value = res.classes || {}
    origins.value = Object.keys(res.origins || {})
  } catch {
    // error handled by interceptor
  } finally {
    loading.value = false
  }
}

async function handleInstall(plugin: any) {
  try {
    await ElMessageBox.confirm(`确定安装插件「${plugin.title || plugin.name}」？`, '提示')
    const uuid = plugin.name_uuid || plugin.uuid
    await updateStorage({ [`sillyGirl.plugin_install`]: uuid })
    ElMessage.success('安装请求已发送')
    setTimeout(() => loadPlugins(), 2000)
  } catch { /* 取消 */ }
}

async function handleUninstall(plugin: any) {
  try {
    await ElMessageBox.confirm(`确定卸载插件「${plugin.title || plugin.name}」？`, '警告', { type: 'warning' })
    const uuid = plugin.name_uuid || plugin.uuid
    await updateStorage({ [`sillyGirl.plugin_uninstall`]: uuid })
    ElMessage.success('卸载请求已发送')
    setTimeout(() => loadPlugins(), 2000)
  } catch { /* 取消 */ }
}

async function handleUpgrade(plugin: any) {
  try {
    await ElMessageBox.confirm(`确定升级插件「${plugin.title || plugin.name}」？`, '提示')
    const uuid = plugin.name_uuid || plugin.uuid
    await updateStorage({ [`sillyGirl.plugin_upgrade`]: uuid })
    ElMessage.success('升级请求已发送')
    setTimeout(() => loadPlugins(), 2000)
  } catch { /* 取消 */ }
}

async function handleToggleEnable(plugin: any) {
  const uuid = plugin.name_uuid || plugin.uuid
  const key = `plugins.${uuid}.disabled`
  const isDisabled = plugin.disabled || plugin.enabled === false
  await updateStorage({ [key]: isDisabled ? '' : 'true' })
  ElMessage.success(isDisabled ? '已启用' : '已禁用')
  setTimeout(() => loadPlugins(), 1000)
}

onMounted(() => {
  loadPlugins()
})
</script>

<style lang="scss" scoped>
.plugin-card {
  .plugin-info {
    .plugin-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .plugin-name {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }

    .plugin-desc {
      font-size: 13px;
      color: #909399;
      margin-bottom: 10px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .plugin-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #909399;
      margin-bottom: 12px;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .plugin-actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>
