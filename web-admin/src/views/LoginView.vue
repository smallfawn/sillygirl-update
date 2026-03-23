<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
})
const loading = ref(false)

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请填写账号和密码')
    return
  }

  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.replace(redirect)
    ElMessage.success('登录成功')
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="brand">
      <h1>SillyGirl Admin</h1>
      <p>自动化控制台 · 管理后台</p>
    </div>

    <el-card class="login-card" shadow="hover">
      <div class="card-header">
        <h2>账户登录</h2>
        <p>请输入管理员账号和密码</p>
      </div>

      <el-form :model="form" label-position="top" @keyup.enter="submit">
        <el-form-item label="用户名">
          <el-input
            v-model.trim="form.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model.trim="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            :prefix-icon="Lock"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="submit">
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #eef2ff, #e0e7ff 35%, #f5f5ff 65%, #f8fafc);
  display: grid;
  place-items: center;
  padding: 32px 16px;
}

.brand {
  text-align: center;
  margin-bottom: 18px;
}

.brand h1 {
  margin: 0;
  font-size: 26px;
  color: #1f2937;
}

.brand p {
  margin: 6px 0 0;
  color: #6b7280;
}

.login-card {
  width: min(440px, 100%);
  border-radius: 16px;
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
}

.card-header p {
  margin: 6px 0 16px;
  color: #6b7280;
}
</style>

