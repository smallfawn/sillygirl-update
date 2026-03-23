<template>
  <section class="panel">
    <h2>欢迎使用傻妞后台</h2>
    <p>当前已接入 Vue + Vite + Pinia 架构，可在此继续迁移各业务模块。</p>

    <div class="cards">
      <article class="info-card">
        <h3>用户</h3>
        <p>{{ authStore.profile?.name || '-' }}</p>
      </article>
      <article class="info-card">
        <h3>脚本数量</h3>
        <p>{{ authStore.plugins.length }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
</script>
