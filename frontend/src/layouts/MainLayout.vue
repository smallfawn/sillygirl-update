<template>
  <div class="layout">
    <aside class="sider">
      <div class="brand">SillyGirl Admin</div>
      <nav class="menu">
        <RouterLink class="menu-item" to="/">首页</RouterLink>
        <RouterLink
          v-for="item in authStore.plugins"
          :key="item.path"
          class="menu-item"
          :to="item.path"
        >
          {{ item.name }}
        </RouterLink>
      </nav>
    </aside>

    <section class="main">
      <header class="header">
        <div class="user">{{ authStore.profile?.name || '未登录' }}</div>
        <button class="logout" @click="handleLogout">退出登录</button>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>
