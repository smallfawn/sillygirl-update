<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo-area">
        <span class="logo-text" v-show="!isCollapse">傻妞面板</span>
      </div>
      
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/welcome">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        
        <el-sub-menu index="/plugin">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>插件管理</span>
          </template>
          <el-menu-item index="/plugin">插件列表</el-menu-item>
          <el-menu-item index="/plugin/publish">发布插件</el-menu-item>
          <el-menu-item index="/plugin/subscribe">订阅插件</el-menu-item>
          <el-menu-item index="/plugin/share">分享插件</el-menu-item>
        </el-sub-menu>
        
        <el-sub-menu index="/message">
          <template #title>
            <el-icon><ChatDotRound /></el-icon>
            <span>消息管理</span>
          </template>
          <el-menu-item index="/message/listen">消息监听</el-menu-item>
          <el-menu-item index="/message/noreply">不回复列表</el-menu-item>
          <el-menu-item index="/message/private">私聊管理</el-menu-item>
        </el-sub-menu>
        
        <el-menu-item index="/carry">
          <el-icon><Switch /></el-icon>
          <template #title>消息搬运</template>
        </el-menu-item>
        
        <el-menu-item index="/storage">
          <el-icon><Coin /></el-icon>
          <template #title>存储管理</template>
        </el-menu-item>
        
        <el-menu-item index="/task">
          <el-icon><Timer /></el-icon>
          <template #title>任务管理</template>
        </el-menu-item>
        
        <el-menu-item index="/reply">
          <el-icon><ChatLineRound /></el-icon>
          <template #title>自动回复</template>
        </el-menu-item>
        
        <el-menu-item index="/master">
          <el-icon><UserFilled /></el-icon>
          <template #title>管理员</template>
        </el-menu-item>
        
        <el-menu-item index="/proxy">
          <el-icon><Connection /></el-icon>
          <template #title>代理设置</template>
        </el-menu-item>
        
        <el-menu-item index="/script">
          <el-icon><Edit /></el-icon>
          <template #title>脚本编辑</template>
        </el-menu-item>
        
        <el-menu-item index="/secret/fenyong">
          <el-icon><Money /></el-icon>
          <template #title>分佣设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">管理员</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = (command) => {
  if (command === 'logout') {
    userStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
}

.logo-area {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2b3649;
}

.logo-text {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  margin-right: 15px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.username {
  margin: 0 8px;
  font-size: 14px;
}

.main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
