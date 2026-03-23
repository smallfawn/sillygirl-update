<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span style="font-weight: 600; font-size: 16px;">基础配置</span>
      </template>

      <el-form :model="config" label-width="120px" style="max-width: 500px;" v-loading="loading">
        <el-form-item label="登录账号">
          <el-input v-model="config.name" placeholder="请输入登录账号" />
        </el-form-item>
        <el-form-item label="登录密码">
          <el-input v-model="config.password" type="password" placeholder="请输入登录密码" show-password />
        </el-form-item>
        <el-form-item label="端口号">
          <el-input-number v-model="config.port" :min="1" :max="65535" />
        </el-form-item>
        <el-form-item label="存储引擎">
          <el-select v-model="config.reborn" placeholder="选择存储引擎">
            <el-option label="BoltDB (默认)" value="" />
            <el-option label="Redis" value="redis" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div style="max-width: 500px;">
        <el-form-item label="一键升级" label-width="120px">
          <el-button type="success" :loading="upgrading" @click="handleUpgrade">
            检查并升级
          </el-button>
        </el-form-item>
        <el-form-item label="重启程序" label-width="120px">
          <el-button type="warning" :loading="restarting" @click="handleRestart">
            重启程序
          </el-button>
        </el-form-item>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStorage, updateStorage } from '@/api/storage'

const loading = ref(false)
const saving = ref(false)
const upgrading = ref(false)
const restarting = ref(false)

const config = reactive({
  name: '',
  password: '',
  port: 8080,
  reborn: '',
})

async function loadConfig() {
  loading.value = true
  try {
    const res: any = await getStorage('sillyGirl.name,sillyGirl.password,sillyGirl.port,sillyGirl.reborn')
    if (res.data) {
      config.name = res.data['sillyGirl.name'] || ''
      config.password = res.data['sillyGirl.password'] || ''
      config.port = Number(res.data['sillyGirl.port']) || 8080
      config.reborn = res.data['sillyGirl.reborn'] || ''
    }
  } catch (e) {
    console.error('加载配置失败', e)
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  saving.value = true
  try {
    await updateStorage({
      'sillyGirl.name': config.name,
      'sillyGirl.password': config.password,
      'sillyGirl.port': config.port,
      'sillyGirl.reborn': config.reborn,
    })
    ElMessage.success('保存成功')
  } catch (e) {
    // error handled by interceptor
  } finally {
    saving.value = false
  }
}

async function handleUpgrade() {
  try {
    await ElMessageBox.confirm('确定要执行一键升级吗？', '提示', { type: 'warning' })
    upgrading.value = true
    // 升级通过存储 API 触发
    await updateStorage({ 'sillyGirl.upgrade': 'true' })
    ElMessage.success('升级已触发，请稍等...')
  } catch {
    // 取消
  } finally {
    upgrading.value = false
  }
}

async function handleRestart() {
  try {
    await ElMessageBox.confirm('确定要重启程序吗？', '警告', { type: 'warning' })
    restarting.value = true
    await updateStorage({ 'sillyGirl.restart': 'true' })
    ElMessage.success('重启命令已发送')
  } catch {
    // 取消
  } finally {
    restarting.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
