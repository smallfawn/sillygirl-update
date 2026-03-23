<template>
  <div class="auth-page">
    <form class="card" @submit.prevent="handleSubmit">
      <h1>管理后台登录</h1>
      <p class="sub">使用傻妞账号密码登录</p>

      <label class="field">
        <span>用户名</span>
        <input v-model.trim="form.username" placeholder="请输入用户名" required />
      </label>

      <label class="field">
        <span>密码</span>
        <input
          v-model.trim="form.password"
          type="password"
          placeholder="请输入密码"
          required
        />
      </label>

      <button class="primary" :disabled="submitting" type="submit">
        {{ submitting ? '登录中...' : '登录' }}
      </button>

      <p v-if="errorText" class="error">{{ errorText }}</p>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const submitting = ref(false);
const errorText = ref('');
const form = reactive({
  username: '',
  password: ''
});

const handleSubmit = async () => {
  errorText.value = '';
  submitting.value = true;
  try {
    const success = await authStore.login({ ...form });
    if (success) {
      const redirect = route.query.redirect || '/';
      router.replace(String(redirect));
      return;
    }
    errorText.value = '用户名或密码错误';
  } catch (error) {
    errorText.value = '登录失败，请稍后重试';
  } finally {
    submitting.value = false;
  }
};
</script>
