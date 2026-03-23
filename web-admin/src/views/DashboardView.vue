<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const cards = computed(() => [
  { title: '存储管理', desc: '管理 bucket 与 key/value 配置', route: '/storage' },
  { title: '任务管理', desc: '管理定时任务与执行状态', route: '/tasks' },
  { title: '自动回复', desc: '维护回复规则与触发条件', route: '/reply' },
  { title: '消息搬运', desc: '配置群消息搬运策略', route: '/carry' },
  { title: '管理员', desc: '维护 master 列表', route: '/masters' },
  { title: '插件市场', desc: '浏览与管理插件能力', route: '/plugins' },
  { title: '代理设置', desc: '维护代理节点、规则与脚本绑定', route: '/proxy' },
  { title: '脚本编辑', desc: '创建与维护 plugins 脚本内容', route: '/script' },
])
</script>

<template>
  <section class="dashboard">
    <el-card class="welcome" shadow="hover">
      <div class="welcome-content">
        <div>
          <h3>你好，{{ userStore.displayName }}</h3>
          <p>这是新版 Vue3 + Vite + Pinia + Element Plus 管理后台骨架，已完成登录鉴权与导航框架。</p>
        </div>
      </div>
    </el-card>

    <el-row :gutter="12">
      <el-col v-for="item in cards" :key="item.route" :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="card" shadow="hover" @click="router.push(item.route)">
          <h4>{{ item.title }}</h4>
          <p>{{ item.desc }}</p>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 12px;
}

.welcome {
  border-radius: 12px;
}

.welcome-content h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
}

.welcome-content p {
  margin: 6px 0 0;
  color: #4b5563;
}

.card {
  margin-top: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card h4 {
  margin: 0;
  color: #111827;
}

.card p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}
</style>


