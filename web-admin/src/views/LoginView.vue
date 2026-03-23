<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
})
const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!form.username || !form.password) {
    errorMsg.value = '请填写账号和密码'
    return
  }

  loading.value = true
  errorMsg.value = ''
  try {
    await userStore.login(form.username, form.password)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.replace(redirect)
  } catch (error) {
    errorMsg.value = error.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="card">
      <h1>登录 SillyGirl 控制台</h1>
      <p>使用机器人管理员账号进入后台。</p>

      <label>
        用户名
        <input v-model.trim="form.username" placeholder="请输入用户名" @keyup.enter="submit" />
      </label>

      <label>
        密码
        <input
          v-model.trim="form.password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="submit"
        />
      </label>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

      <button :disabled="loading" @click="submit">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #a78bfa, #4c1d95 58%, #2b0f66);
  display: grid;
  place-items: center;
  padding: 24px;
}

.card {
  width: min(420px, 100%);
  background: rgba(255, 255, 255, 0.94);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 12px 30px rgba(31, 41, 55, 0.25);
}

h1 {
  margin: 0;
  font-size: 24px;
  color: #111827;
}

p {
  margin: 10px 0 20px;
  color: #4b5563;
}

label {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
  color: #374151;
  font-size: 14px;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 10px 12px;
  outline: none;
  transition: border-color 0.2s ease;
}

input:focus {
  border-color: #7c3aed;
}

button {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 11px;
  background: #7c3aed;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error {
  color: #dc2626;
  font-size: 13px;
  margin: 4px 0 12px;
}
</style>
