<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
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
  if (!kw) {
    return state.scripts
  }
  return state.scripts.filter((item) => {
    return item.uuid.toLowerCase().includes(kw) || item.name.toLowerCase().includes(kw)
  })
})

const pageTitle = computed(() => {
  const selected = selectedScript.value
  if (!selected) {
    return '脚本编辑'
  }
  return selected.name || `脚本 ${state.selectedUuid}`
})

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
  if (!Array.isArray(plugins)) {
    return []
  }
  return plugins
    .map((item) => {
      const path = String(item?.Path || item?.path || '')
      const uuid = parseUuidFromPath(path)
      if (!uuid) {
        return null
      }
      const name = String(item?.Name || item?.name || uuid)
      return {
        uuid,
        name,
        isCreate: name.includes('+新增脚本'),
      }
    })
    .filter(Boolean)
}

function pickDefaultUuid(list) {
  if (!Array.isArray(list) || !list.length) {
    return ''
  }
  const firstNormal = list.find((item) => !item.isCreate)
  return firstNormal?.uuid || list[0].uuid
}

function getStorageError(res, key) {
  if (!res?.errors) {
    return ''
  }
  return String(res.errors[key] || '')
}

function askDiscardChanges(message = '当前脚本有未保存修改，确定继续并放弃改动吗？') {
  if (!isDirty.value) {
    return true
  }
  return window.confirm(message)
}

function handleBeforeUnload(event) {
  if (!isDirty.value) {
    return
  }
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
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  const tpl = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
  return tpl.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
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
    if (target) {
      await loadScriptByUuid(target)
    }
    return
  }

  if (routeUuid) {
    await loadScriptByUuid(routeUuid, false)
    return
  }

  const defaultUuid = pickDefaultUuid(state.scripts)
  if (defaultUuid) {
    await loadScriptByUuid(defaultUuid)
  }
}

async function handleSelect(uuid) {
  if (!uuid || uuid === state.selectedUuid) {
    return
  }
  if (!askDiscardChanges()) {
    return
  }
  await loadScriptByUuid(uuid)
}

function resetContent() {
  if (!isDirty.value) {
    return
  }
  if (!window.confirm('确定撤销当前未保存内容，恢复到上次加载状态吗？')) {
    return
  }
  state.content = state.originalContent
  state.message = '已恢复到上次加载状态'
  state.error = ''
}

function insertTemplate() {
  const template = scriptTemplates.find((item) => item.key === selectedTemplate.value)
  if (!template) {
    return
  }

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
    state.error = '请选择脚本后再保存'
    return
  }

  state.saving = true
  state.error = ''
  state.message = ''

  try {
    const res = await saveScriptContent(uuid, state.content)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) {
      throw new Error(err)
    }
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
  if (!uuid) {
    return
  }

  const selected = selectedScript.value
  if (selected?.isCreate) {
    state.error = '“+新增脚本”是保留入口，不能删除。'
    return
  }

  if (!window.confirm(`确定删除脚本「${selected?.name || uuid}」吗？此操作不可恢复。`)) {
    return
  }

  state.deleting = true
  state.error = ''
  state.message = ''

  try {
    const res = await deleteScriptContent(uuid)
    const key = `plugins.${uuid}`
    const err = getStorageError(res, key)
    if (err) {
      throw new Error(err)
    }

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
  if (!uuid) {
    uuid = generateUuid()
  }

  const exists = state.scripts.some((item) => item.uuid === uuid && !item.isCreate)
  if (exists) {
    state.error = `脚本 UUID 已存在：${uuid}`
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
    if (err) {
      throw new Error(err)
    }

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
  if (!uuid) {
    return
  }

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
  async (next, prev) => {
    if (syncingRoute.value) {
      return
    }

    const nextUuid = String(next || '').trim()
    const prevUuid = String(prev || '').trim()
    if (nextUuid === prevUuid) {
      return
    }

    if (!nextUuid) {
      return
    }

    if (!askDiscardChanges()) {
      syncingRoute.value = true
      await router.replace(state.selectedUuid ? `/script/${state.selectedUuid}` : '/script')
      syncingRoute.value = false
      return
    }

    if (nextUuid === 'new') {
      const target = createScript.value?.uuid || pickDefaultUuid(state.scripts)
      if (target) {
        await loadScriptByUuid(target)
      }
      return
    }

    if (nextUuid !== state.selectedUuid) {
      await loadScriptByUuid(nextUuid, false)
    }
  },
)

onBeforeRouteLeave(() => {
  if (!askDiscardChanges('当前脚本有未保存修改，离开页面将丢失改动，确定离开吗？')) {
    return false
  }
  return true
})

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('keydown', handleEditorKeydown)
  await bootstrapFromRoute()
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('keydown', handleEditorKeydown)
})
</script>

<template>
  <section class="script-editor-page">
    <section class="panel left">
      <div class="panel-head">
        <h3>脚本列表</h3>
        <div class="head-actions">
          <button class="ghost" @click="prepareCreateScript">新建脚本</button>
          <button class="ghost" @click="ensureScriptsReady(true)">刷新</button>
        </div>
      </div>
      <p class="hint">支持按标题/UUID 搜索，点击即可切换到对应脚本。</p>

      <input v-model.trim="state.keyword" class="search-input" placeholder="搜索脚本标题或 UUID" />

      <div v-if="state.showCreatePanel" class="create-panel">
        <h4>创建脚本</h4>
        <input v-model.trim="state.createUuid" placeholder="脚本 UUID（默认自动生成）" />
        <input v-model.trim="state.createTitle" placeholder="脚本标题（可选）" />
        <div class="create-actions">
          <button class="primary" :disabled="state.saving" @click="handleCreateScript">确认创建</button>
          <button :disabled="state.saving" @click="state.showCreatePanel = false">取消</button>
        </div>
      </div>

      <div v-if="!filteredScripts.length" class="empty">没有匹配脚本</div>
      <div v-else class="script-list">
        <button
          v-for="item in filteredScripts"
          :key="item.uuid"
          class="script-item"
          :class="{ active: state.selectedUuid === item.uuid, create: item.isCreate }"
          @click="handleSelect(item.uuid)"
        >
          <strong>{{ item.name }}</strong>
          <small>{{ item.uuid }}</small>
        </button>
      </div>
    </section>

    <section class="panel right">
      <div class="panel-head top-row">
        <h3>{{ pageTitle }}</h3>
        <div class="actions">
          <button class="primary" :disabled="state.loading || state.saving || !state.selectedUuid" @click="handleSave">
            {{ state.saving ? '保存中...' : '保存脚本 (Ctrl/Cmd+S)' }}
          </button>
          <button class="warning" :disabled="!isDirty || state.loading" @click="resetContent">撤销改动</button>
          <button :disabled="!state.selectedUuid" @click="copyUuid">复制 UUID</button>
          <button
            class="danger"
            :disabled="state.loading || state.deleting || !state.selectedUuid || selectedScript?.isCreate"
            @click="handleDelete"
          >
            {{ state.deleting ? '删除中...' : '删除脚本' }}
          </button>
        </div>
      </div>

      <div class="meta-row" v-if="state.selectedUuid">
        <p class="hint">当前 UUID：{{ state.selectedUuid }}</p>
        <p class="hint">行数：{{ scriptStats.lines }}，字符：{{ scriptStats.chars }}</p>
      </div>

      <div class="template-row">
        <label>模板片段：</label>
        <select v-model="selectedTemplate">
          <option v-for="item in scriptTemplates" :key="item.key" :value="item.key">
            {{ item.name }}
          </option>
        </select>
        <button :disabled="state.loading || !state.selectedUuid" @click="insertTemplate">插入模板</button>
        <button :disabled="state.loading || !state.selectedUuid" @click="formatNowCode">空白+模板</button>
      </div>

      <p v-if="isDirty" class="dirty-tip">你有未保存修改</p>
      <p v-if="state.message" class="msg success">{{ state.message }}</p>
      <p v-if="state.error" class="msg error">{{ state.error }}</p>

      <div v-if="state.loading" class="empty">脚本加载中...</div>
      <textarea
        v-else
        ref="editorRef"
        v-model="state.content"
        class="editor"
        rows="24"
        placeholder="请输入 JavaScript 脚本内容"
      />
    </section>
  </section>
</template>

<style scoped>
.script-editor-page {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  min-height: 520px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.head-actions {
  display: flex;
  gap: 8px;
}

h3,
h4 {
  margin: 0;
  color: #111827;
}

.hint {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.search-input {
  margin-top: 10px;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 10px;
}

.create-panel {
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 8px;
  background: #fafafa;
}

.create-panel input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

.create-actions {
  display: flex;
  gap: 8px;
}

.script-list {
  margin-top: 12px;
  display: grid;
  gap: 8px;
  max-height: 65vh;
  overflow: auto;
}

.script-item {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 10px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 4px;
}

.script-item strong {
  color: #111827;
}

.script-item small {
  color: #6b7280;
  font-size: 12px;
}

.script-item:hover {
  border-color: #c4b5fd;
  background: #faf5ff;
}

.script-item.active {
  border-color: #7c3aed;
  background: #f5f3ff;
}

.script-item.create strong {
  color: #7c3aed;
}

.top-row {
  align-items: flex-start;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-row {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.template-row {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.template-row select {
  min-width: 180px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 7px 10px;
}

button {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.primary {
  border-color: #7c3aed;
  background: #7c3aed;
  color: #fff;
}

button.warning {
  border-color: #d97706;
  color: #d97706;
}

button.danger {
  border-color: #dc2626;
  color: #dc2626;
}

button.ghost {
  padding: 6px 10px;
}

.dirty-tip {
  margin: 10px 0 0;
  color: #b45309;
  font-size: 13px;
}

.msg {
  margin: 10px 0 0;
  font-size: 13px;
}

.msg.success {
  color: #166534;
}

.msg.error {
  color: #b91c1c;
}

.empty {
  margin-top: 12px;
  padding: 18px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  color: #6b7280;
}

.editor {
  margin-top: 12px;
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  min-height: 460px;
}

@media (max-width: 1024px) {
  .script-editor-page {
    grid-template-columns: 1fr;
  }
}
</style>
