<template>
  <el-container class="app-layout">
    <!-- 侧边栏 -->
    <el-aside :width="appStore.sidebarCollapsed ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <img src="/logo.svg" alt="Logo" class="logo-img" />
        <span v-show="!appStore.sidebarCollapsed" class="logo-text">傻妞机器人</span>
      </div>
      <el-menu
        :default-active="currentRoute"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        router
        background-color="#001529"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>

        <el-menu-item index="/basic">
          <el-icon><Setting /></el-icon>
          <template #title>基础配置</template>
        </el-menu-item>

        <el-sub-menu index="plugin">
          <template #title>
            <el-icon><Grid /></el-icon>
            <span>插件管理</span>
          </template>
          <el-menu-item index="/plugin/share">插件市场</el-menu-item>
          <el-menu-item index="/plugin/publish">插件发布</el-menu-item>
          <el-menu-item index="/plugin/subscribe">插件订阅</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/storage">
          <el-icon><Coin /></el-icon>
          <template #title>存储管理</template>
        </el-menu-item>

        <el-menu-item index="/reply">
          <el-icon><ChatDotRound /></el-icon>
          <template #title>回复管理</template>
        </el-menu-item>

        <el-menu-item index="/task">
          <el-icon><Timer /></el-icon>
          <template #title>计划任务</template>
        </el-menu-item>

        <el-menu-item index="/carry">
          <el-icon><Switch /></el-icon>
          <template #title>消息搬运</template>
        </el-menu-item>

        <el-sub-menu index="message">
          <template #title>
            <el-icon><Message /></el-icon>
            <span>消息管理</span>
          </template>
          <el-menu-item index="/message/listen">消息监听</el-menu-item>
          <el-menu-item index="/message/noreply">不回复群</el-menu-item>
          <el-menu-item index="/message/private">屏蔽用户</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/proxy">
          <el-icon><Link /></el-icon>
          <template #title>代理管理</template>
        </el-menu-item>

        <el-menu-item index="/master">
          <el-icon><User /></el-icon>
          <template #title>管理员管理</template>
        </el-menu-item>

        <el-menu-item index="/secret/fenyong">
          <el-icon><TrendCharts /></el-icon>
          <template #title>返利统计</template>
        </el-menu-item>

        <!-- 动态脚本路由 -->
        <el-sub-menu v-if="scriptRoutes.length > 0" index="scripts">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>脚本管理</span>
          </template>
          <el-menu-item
            v-for="route in scriptRoutes"
            :key="route.path"
            :index="route.path"
          >
            {{ route.name }}
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon
            class="collapse-btn"
            @click="appStore.toggleSidebar"
          >
            <Expand v-if="appStore.sidebarCollapsed" />
            <Fold v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ userStore.userInfo?.name || '管理员' }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  HomeFilled, Setting, Grid, Coin, ChatDotRound, Timer,
  Switch, Message, Link, User, TrendCharts, Document,
  Expand, Fold, ArrowDown,
} from '@element-plus/icons-vue'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const currentRoute = computed(() => route.path)

const scriptRoutes = computed(() => {
  return userStore.dynamicRoutes.filter(r => r.path.startsWith('/script/'))
})

onMounted(async () => {
  await userStore.fetchCurrentUser()
})

async function handleCommand(command: string) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
      await userStore.logoutAction()
      router.push('/login')
    } catch { /* 取消 */ }
  }
}
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
}

.sidebar {
  background-color: #001529;
  transition: width 0.3s;
  overflow: hidden;

  .logo {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 10px;
    overflow: hidden;

    .logo-img {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.header {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 56px;

  .header-left {
    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #333;
      &:hover {
        color: #409eff;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #333;
      font-size: 14px;

      &:hover {
        color: #409eff;
      }
    }
  }
}

.main-content {
  background: #f5f7fa;
  padding: 0;
  overflow: hidden;
}
</style>
