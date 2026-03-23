<script setup>
import { computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { Menu, MessageBox, Monitor, Setting, SwitchButton, Tickets, CollectionTag, Notebook, DataLine } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const menus = [
  { name: 'dashboard', title: '控制台', path: '/dashboard', icon: Monitor },
  { name: 'storage', title: '存储管理', path: '/storage', icon: DataLine },
  { name: 'tasks', title: '任务管理', path: '/tasks', icon: Notebook },
  { name: 'reply', title: '自动回复', path: '/reply', icon: Tickets },
  { name: 'carry', title: '消息搬运', path: '/carry', icon: CollectionTag },
  { name: 'masters', title: '管理员', path: '/masters', icon: Setting },
  { name: 'plugins', title: '插件市场', path: '/plugins', icon: Menu },
  { name: 'proxy', title: '代理设置', path: '/proxy', icon: MessageBox },
  { name: 'script-editor', title: '脚本编辑', path: '/script', icon: Notebook },
]

const activePath = computed(() => route.path)

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '确认退出', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }
  await userStore.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="admin-shell">
    <el-container class="page-container">
      <el-aside width="240px" class="aside">
        <div class="brand">
          <div class="logo">SG</div>
          <div>
            <h1>SillyGirl Admin</h1>
            <p>自动化控制台</p>
          </div>
        </div>

        <el-menu
          :default-active="activePath"
          router
          class="side-menu"
          :collapse="false"
          background-color="#0f172a"
          text-color="#cbd5e1"
          active-text-color="#16a34a"
        >
          <el-menu-item v-for="item in menus" :key="item.name" :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item>首页</el-breadcrumb-item>
              <el-breadcrumb-item>{{ menus.find((m) => activePath.startsWith(m.path))?.title || '管理后台' }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-actions">
            <span class="user">{{ userStore.displayName }}</span>
            <el-button type="danger" link :icon="SwitchButton" @click="handleLogout">退出</el-button>
          </div>
        </el-header>

        <el-main class="main">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.admin-shell {
  min-height: 100vh;
  background: #f5f6fa;
}

.page-container {
  min-height: 100vh;
}

.aside {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px 12px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-bottom: 12px;
  color: #e2e8f0;
}

.brand h1 {
  margin: 0;
  font-size: 18px;
}

.brand p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #cbd5e1;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #0f172a;
}

.side-menu {
  border-right: none;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 16px;
  height: 64px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #334155;
}

.user {
  font-weight: 600;
}

.main {
  padding: 16px;
  background: #f5f6fa;
}
</style>
