<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menus = [
  { name: 'dashboard', title: '控制台', path: '/dashboard' },
  { name: 'storage', title: '存储管理', path: '/storage' },
  { name: 'tasks', title: '任务管理', path: '/tasks' },
  { name: 'reply', title: '自动回复', path: '/reply' },
  { name: 'carry', title: '消息搬运', path: '/carry' },
  { name: 'masters', title: '管理员', path: '/masters' },
  { name: 'plugins', title: '插件市场', path: '/plugins' },
  { name: 'proxy', title: '代理设置', path: '/proxy' },
  { name: 'script-editor', title: '脚本编辑', path: '/script' },
]

const activePath = computed(() => route.path)

async function handleLogout() {
  await userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <div class="brand">
        <h1>SillyGirl Admin</h1>
        <p>自动化控制台</p>
      </div>

      <nav class="menu">
        <button
          v-for="item in menus"
          :key="item.name"
          class="menu-item"
          :class="{ active: activePath.startsWith(item.path) }"
          @click="router.push(item.path)"
        >
          {{ item.title }}
        </button>
      </nav>
    </aside>

    <div class="main-area">
      <header class="topbar">
        <div>
          <h2>{{ menus.find((m) => activePath.startsWith(m.path))?.title || '管理后台' }}</h2>
          <span>欢迎，{{ userStore.displayName }}</span>
        </div>
        <button class="logout" @click="handleLogout">退出登录</button>
      </header>

      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px 1fr;
  background: #f3f4f6;
}

.sidebar {
  background: linear-gradient(180deg, #2b0f66, #7c3aed);
  color: #f5f3ff;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.brand h1 {
  font-size: 20px;
  margin: 0;
}

.brand p {
  margin: 8px 0 0;
  color: #ddd6fe;
  font-size: 13px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-item {
  border: none;
  background: transparent;
  color: #ede9fe;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background: rgba(221, 214, 254, 0.2);
}

.menu-item.active {
  background: rgba(249, 115, 22, 0.9);
  color: white;
}

.main-area {
  display: grid;
  grid-template-rows: 72px 1fr;
}

.topbar {
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.topbar h2 {
  margin: 0;
  font-size: 20px;
  color: #111827;
}

.topbar span {
  font-size: 13px;
  color: #6b7280;
}

.logout {
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.content {
  padding: 20px;
}

@media (max-width: 900px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding-bottom: 12px;
  }

  .menu {
    flex-direction: row;
    overflow-x: auto;
  }

  .main-area {
    grid-template-rows: auto 1fr;
  }
}
</style>
