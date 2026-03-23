<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span style="font-weight: 600; font-size: 16px;">脚本编辑器</span>
          <div>
            <el-button @click="goBack">
              <el-icon><ArrowLeft /></el-icon> 返回
            </el-button>
            <el-button type="primary" :loading="saving" @click="saveScript">
              <el-icon><Check /></el-icon> 保存
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading" class="editor-container">
        <div ref="editorRef" class="monaco-editor" style="width: 100%; height: 100%;"></div>
      </div>

      <el-divider />
      <el-form :model="scriptConfig" label-width="100px" style="max-width: 600px;">
        <el-form-item label="脚本名称">
          <el-input v-model="scriptConfig.name" placeholder="脚本名称" />
        </el-form-item>
        <el-form-item label="脚本说明">
          <el-input v-model="scriptConfig.desc" type="textarea" :rows="3" placeholder="脚本功能说明" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="scriptConfig.isPublic" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Check } from '@element-plus/icons-vue'
import * as monaco from 'monaco-editor'
import { getStorage, updateStorage } from '@/api/storage'

const route = useRoute()
const router = useRouter()
const editorRef = ref<HTMLElement>()
const loading = ref(false)
const saving = ref(false)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const uuid = computed(() => route.params.uuid as string)

const scriptConfig = reactive({
  name: '',
  desc: '',
  isPublic: false,
})

async function loadScript() {
  loading.value = true
  try {
    const res: any = await getStorage(`plugins.${uuid.value}`)
    const content = res.data?.[`plugins.${uuid.value}`]
    if (content) {
      await nextTick()
      if (editorRef.value) {
        if (editor) editor.dispose()
        editor = monaco.editor.create(editorRef.value, {
          value: content,
          language: 'javascript',
          theme: 'vs-dark',
          minimap: { enabled: true },
          fontSize: 14,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
        })
      }
    }
  } catch (e) {
    console.error('加载脚本失败', e)
  } finally {
    loading.value = false
  }
}

async function saveScript() {
  if (!editor) return
  saving.value = true
  try {
    const content = editor.getValue()
    await updateStorage({ [`plugins.${uuid.value}`]: content }, uuid.value)
    ElMessage.success('保存成功')
  } catch {
    // error handled by interceptor
  } finally {
    saving.value = false
  }
}

function goBack() {
  router.push('/')
}

onMounted(() => {
  loadScript()
})

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose()
    editor = null
  }
})
</script>

<style lang="scss" scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-container {
  height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.monaco-editor {
  height: 100%;
}
</style>
