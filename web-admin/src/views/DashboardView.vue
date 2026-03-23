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
    <header class="welcome">
      <h3>你好，{{ userStore.displayName }}</h3>
      <p>这是新版 Vue3 + Vite + Pinia 管理后台骨架，已完成登录鉴权与导航框架。</p>
    </header>

    <div class="grid">
      <article v-for="item in cards" :key="item.route" class="card" @click="router.push(item.route)">
        <h4>{{ item.title }}</h4>
        <p>{{ item.desc }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  display: grid;
  gap: 16px;
}

.welcome {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
}

.welcome h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
}

.welcome p {
  margin: 8px 0 0;
  color: #4b5563;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card:hover {
  border-color: #c4b5fd;
  box-shadow: 0 6px 18px rgba(124, 58, 237, 0.12);
  transform: translateY(-1px);
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

