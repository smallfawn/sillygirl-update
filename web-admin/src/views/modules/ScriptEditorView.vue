<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../../stores/user'
import { deleteScriptContent, queryScriptContent, saveScriptContent } from '../../api/scripts'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const editorRef = ref(null)
const selectedTemplate = ref('reply-basic')
const syncingRoute = ref(false)

const scriptTemplates = [
  {
    key: 'reply-basic',
    name: '基础回复模板',
    content: `// 基础回复模板\nconst message = sender.getContent()\nif (/测试|hello/i.test(message)) {\n  sender.reply('收到，脚本已生效。')\n}`,
  },
  {
    key: 'cron-basic',
    name: '定时任务模板',
    content: `// 定时任务模板\n// cron: 0 */6 * * *\ncron('0 */6 * * *', async () => {\n  console.log('每 6 小时执行一次')\n})`,
  },
  {
    key: 'http-basic',
    name: 'HTTP 请求模板',
    content: `// HTTP 请求模板\nconst res = await request({\n  url: 'https://example.com/api',\n  method: 'get',\n})\nconsole.log('接口结果', res)`,
  },
]

const state = reactive({
  loading: false,
  saving: false,
  deleting: false,
  scripts: [],
  selectedUuid: '',
  content: '',
  originalContent: '',
  keyword: '',
  showCreatePanel: false,
  createUuid: '',
  createTitle: '',
  message: '',
  error: '',
})

const selectedScript = computed(() => state.scripts.find((item) => item.uuid === state.selectedUuid) || null)
const createScript = computed(() => state.scripts.find((item) => item.isCreate) || null)
const isDirty = computed(() => state.content !== state.originalContent)

const filteredScripts = computed(() => {
  const kw = state.keyword.trim().toLowerCase()
  if (!kw) return state.scripts
  return state.scripts.filter((item) => item.uuid.toLowerCase().includes(kw) || item.name.toLowerCase().includes(kw))
})

const pageTitle = computed(() => selectedScript.value?.name || `脚本 ${state.selectedUuid || ''}` || '脚本编辑')

const scriptStats = computed(() => {
  const content = state.content || ''
  const lines = content ? content.split('\n').length : 0
  const chars = content.length
  return { lines, chars }
})

function parseUuidFromPath(path = '') {
  const seg = String(path || '').split('/').filter(Boolean)
  return seg[1] || ''
}

function normalizeScripts() {
  const plugins = userStore.profile?.plugins
  if (!Array.isArray(plugins)) return []
  return plugins
    .map((item) => {
      const path = String(item?.Path || item?.path || '')
      const uuid = parseUuidFromPath(path)
      if (!uuid) return null
      const name = String(item?.Name || item?.name || uuid)
      return { uuid, name, isCreate: name.includes('+新增脚本') }
    })
    .filter(Boolean)
}

function pickDefaultUuid(list) {
  if (!Array.isArray(list) || !list.length) return ''
  const firstNormal = list.find((item) => !item.isCreate)
  return firstNormal?.uuid || list[0].uuid
}

function getStorageError(res, key) {
  if (!res?.errors) return ''
  return String(res.errors[key] || '')
}

function askDiscardChanges(message = '当前脚本有未保存修改，确定继续并放弃改动吗？') {
  return isDirty.value ? confirm(message) : true
}

function handleBeforeUnload(event) {
  if (!isDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

function handleEditorKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    if (!state.saving && !state.loading) {
      handleSave()
    }
  }
}

function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  const tpl = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  return tpl.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function prepareCreateScript() {
  const reserved = createScript.value?.uuid || ''
  state.createUuid = reserved || generateUuid()
  state.createTitle = ''
  state.showCreatePanel = true
}

async function ensureScriptsReady(force = false) {
  if (!userStore.profile || force) {
    await userStore.fetchCurrentUser()
  }
  state.scripts = normalizeScripts()
}

async function loadScriptByUuid(uuid, syncRoute = true) {
  const id = String(uuid || '').trim()
  if (!id) {
    state.selectedUuid = ''
    state.content = ''
    state.originalContent = ''
    return
  }

  state.loading = true
  state.error = ''
  state.message = ''

  try {
    const res = await queryScriptContent(id)
    const key = `plugins.${id}`
    const dataMap = res?.data || {}
    const loadedContent = String(dataMap[key] || '')
    state.content = loadedContent
    state.originalContent = loadedContent
    state.selectedUuid = id

    if (syncRoute && route.params.uuid !== id) {
      syncingRoute.value = true
      await router.replace(`/script/${id}`)
      syncingRoute.value = false
    }
  } catch (error) {
    state.error = error.message || '加载脚本失败'
  } finally {
    state.loading = false
  }
}

async function bootstrapFromRoute() {
  await ensureScriptsReady()
  const routeUuid = String(route.params.uuid || '').trim()
  const createUuid = createScript.value?.uuid || ''
  if (routeUuid === 'new') {
    const target = createUuid || pickDefaultUuid(state.scripts)
    if (target) await loadScriptByUuid(target)
    return
  }
  if (routeUuid) {
    await loadScriptByUuid(routeUuid, false)
    return
  }
  const defaultUuid = pickDefaultUuid(state.scripts)
  if (defaultUuid) await loadScriptByUuid(defaultUuid)
}

async function handleSelect(uuid) {
  if (!uuid || uuid === state.selectedUuid) return
  if (!askDiscardChanges()) return
  await loadScriptByUuid(uuid)
}

function resetContent() {
  if (!isDirty.value) return
  ElMessageBox.confirm('确定撤销当前未保存内容，恢复到上次加载状态吗？', '撤销确认', { type: 'warning' })
    .then(() => {
      state.content = state.originalContent
      state.message = '已恢复到上次加载状态'
      state.error = ''
    })
    .catch(() => {})
}

function insertTemplate() {
  const template = scriptTemplates.find((item) => item.key === selectedTemplate.value)
  if (!template) return
  const textarea = editorRef.value
  const block = `\n\n${template.content}\n`
  if (!textarea) {
    state.content = `${state.content}${block}`
    return
  }
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  state.content = `${state.content.slice(0, start)}${block}${state.content.slice(end)}`
  requestAnimationFrame(() => {
    textarea.focus()
    const pos = start + block.length
    textarea.setSelectionRange(pos, pos)
  })
}

async function handleSave() {
  const uuid = state.selectedUuid
  if (!uuid) {
    ElMessage.warning('请选择脚本后再保存')
    return
  }
  state.saving = true
  state.error = ''
  state.message = ''
  try {
    const res = await saveScriptContent(uuid, state.content)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) throw new Error(err)
    const changed = Boolean(res?.changes?.[key])
    state.originalContent = state.content
    state.message = changed ? `脚本已保存：${uuid}` : `脚本内容未变化：${uuid}`
    await ensureScriptsReady(true)
  } catch (error) {
    state.error = error.message || '保存脚本失败'
  } finally {
    state.saving = false
  }
}

async function handleDelete() {
  const uuid = state.selectedUuid
  if (!uuid) return
  const selected = selectedScript.value
  if (selected?.isCreate) {
    ElMessage.warning('“+新增脚本”是保留入口，不能删除。')
    return
  }
  try {
    await ElMessageBox.confirm(`确定删除脚本「${selected?.name || uuid}」吗？此操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.deleting = true
  state.error = ''
  state.message = ''
  try {
    const res = await deleteScriptContent(uuid)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) throw new Error(err)
    state.message = `已删除脚本：${uuid}`
    await userStore.fetchCurrentUser()
    state.scripts = normalizeScripts()
    const nextUuid = createScript.value?.uuid || pickDefaultUuid(state.scripts)
    if (nextUuid) {
      await loadScriptByUuid(nextUuid)
    } else {
      state.selectedUuid = ''
      state.content = ''
      state.originalContent = ''
      router.replace('/script')
    }
  } catch (error) {
    state.error = error.message || '删除脚本失败'
  } finally {
    state.deleting = false
  }
}

async function handleCreateScript() {
  let uuid = state.createUuid.trim()
  if (!uuid) uuid = generateUuid()
  const exists = state.scripts.some((item) => item.uuid === uuid && !item.isCreate)
  if (exists) {
    ElMessage.error(`脚本 UUID 已存在：${uuid}`)
    return
  }
  const title = state.createTitle.trim() || '新脚本'
  const template = `/**\n * ${title}\n * created_at: ${new Date().toISOString()}\n */\n\n`

  state.saving = true
  state.error = ''
  state.message = ''
  try {
    const res = await saveScriptContent(uuid, template)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) throw new Error(err)
    state.showCreatePanel = false
    await ensureScriptsReady(true)
    await loadScriptByUuid(uuid)
    state.message = `已创建脚本：${uuid}`
  } catch (error) {
    state.error = error.message || '创建脚本失败'
  } finally {
    state.saving = false
  }
}

function formatNowCode() {
  if (!state.content.trim()) {
    state.content = `/**\n * 新脚本\n */\n\n`
  }
  insertTemplate()
}

async function copyUuid() {
  const uuid = state.selectedUuid
  if (!uuid) return
  try {
    await navigator.clipboard.writeText(uuid)
    state.message = `已复制 UUID：${uuid}`
  } catch (_) {
    const input = document.createElement('input')
    input.value = uuid
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    state.message = `已复制 UUID：${uuid}`
  }
}

watch(
  () => route.params.uuid,
  async (next) => {
    if (syncingRoute.value) return
    if (!askDiscardChanges()) {
      syncingRoute.value = true
      await router.replace(`/script/${state.selectedUuid || ''}`)
      syncingRoute.value = false
      return
    }
    if (next) {
      await loadScriptByUuid(String(next), false)
    }
  },
)

onBeforeRouteLeave((to, from, next) => {
  if (!askDiscardChanges('当前脚本有未保存修改，确定离开吗？')) {
    next(false)
  } else {
    next()
  }
})

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  document.addEventListener('keydown', handleEditorKeydown)
  await bootstrapFromRoute()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('keydown', handleEditorKeydown)
})
</script>

<template>
  <section class="script-page">
    <el-row :gutter="12">
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="panel">
          <div class="panel-head">
            <div>
              <h3>脚本列表</h3>
              <p class="hint">点击切换脚本，支持搜索与新增。</p>
            </div>
            <el-space>
              <el-button text :loading="state.loading" @click="bootstrapFromRoute">刷新</el-button>
              <el-button type="primary" text @click="prepareCreateScript">+ 新建脚本</el-button>
            </el-space>
          </div>

          <el-input v-model.trim="state.keyword" placeholder="按标题/UUID 搜索" clearable style="margin-bottom: 8px" />

          <el-scrollbar height="420px">
            <el-menu :default-active="state.selectedUuid" class="menu" router="false">
              <el-menu-item
                v-for="item in filteredScripts"
                :key="item.uuid"
                :index="item.uuid"
                @click="handleSelect(item.uuid)"
              >
                <span>{{ item.name }}（{{ item.uuid }}）</span>
              </el-menu-item>
            </el-menu>
          </el-scrollbar>
        </el-card>

        <el-card v-if="state.showCreatePanel" shadow="never" class="panel" style="margin-top: 10px">
          <div class="panel-head">
            <h4>新建脚本</h4>
          </div>
          <el-form label-position="top">
            <el-form-item label="脚本 UUID">
              <el-input v-model.trim="state.createUuid" placeholder="留空自动生成" />
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model.trim="state.createTitle" placeholder="可选" />
            </el-form-item>
            <el-space>
              <el-button type="primary" :loading="state.saving" @click="handleCreateScript">创建</el-button>
              <el-button @click="state.showCreatePanel = false">取消</el-button>
            </el-space>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="16">
        <el-card shadow="never" class="panel">
          <div class="panel-head">
            <div>
              <h3>{{ pageTitle }}</h3>
              <p class="hint">行数：{{ scriptStats.lines }}，字符数：{{ scriptStats.chars }}</p>
            </div>
            <el-space>
              <el-button text @click="copyUuid">复制 UUID</el-button>
              <el-button text @click="formatNowCode">插入模板</el-button>
              <el-button type="danger" text :loading="state.deleting" @click="handleDelete">删除</el-button>
            </el-space>
          </div>

          <el-select v-model="selectedTemplate" placeholder="选择模板" style="margin-bottom: 8px; width: 220px">
            <el-option v-for="tpl in scriptTemplates" :key="tpl.key" :label="tpl.name" :value="tpl.key" />
          </el-select>

          <el-input
            ref="editorRef"
            v-model="state.content"
            type="textarea"
            :rows="22"
            class="editor"
            placeholder="请输入脚本内容"
          />

          <div class="footer-actions">
            <el-button type="primary" :loading="state.saving" @click="handleSave">保存</el-button>
            <el-button @click="resetContent">撤销改动</el-button>
          </div>

          <div v-if="state.message" class="tip success">{{ state.message }}</div>
          <div v-if="state.error" class="tip error">{{ state.error }}</div>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.script-page {
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

.menu {
  border-right: none;
}

.editor {
  width: 100%;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.footer-actions {
  margin-top: 8px;
  display: flex;
  gap: 8px;
}

.tip {
  margin-top: 8px;
  font-size: 13px;
}

.tip.success {
  color: #16a34a;
}

.tip.error {
  color: #dc2626;
}
</style>
