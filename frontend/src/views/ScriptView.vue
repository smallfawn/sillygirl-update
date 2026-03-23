<template>
  <section class="panel">
    <h2>脚本详情</h2>
    <p>当前脚本 ID：{{ route.params.id }}</p>
    <p class="sub">后续可在这里迁移原有脚本编辑器、发布、订阅等能力。</p>
  </section>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
</script>
