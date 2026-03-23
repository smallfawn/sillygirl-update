<template>
  <div class="page-container">
    <div class="welcome-content">
      <h1 class="welcome-title">欢迎使用 傻妞机器人</h1>
      <p class="welcome-desc">一个强大的统一消息处理平台</p>

      <div class="feature-cards">
        <el-card shadow="hover" class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon size="28" color="#409eff"><Switch /></el-icon>
              <span>消息搬运</span>
            </div>
          </template>
          <p>支持跨平台消息采集与转发，可将群消息自动搬运到目标群，支持黑白名单、关键词过滤、文本图片去重等高级功能。</p>
        </el-card>

        <el-card shadow="hover" class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon size="28" color="#67c23a"><Grid /></el-icon>
              <span>插件系统</span>
            </div>
          </template>
          <p>丰富的插件生态，支持在线浏览、安装、升级插件。提供订阅源管理、插件发布功能，可通过 JavaScript 编写自定义插件脚本。</p>
        </el-card>

        <el-card shadow="hover" class="feature-card">
          <template #header>
            <div class="card-header">
              <el-icon size="28" color="#e6a23c"><Promotion /></el-icon>
              <span>傻妞社区</span>
            </div>
          </template>
          <p>活跃的开发者社区，提供文档、教程和技术支持。欢迎加入社区，一起探索更多可能性。</p>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Switch, Grid, Promotion } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.welcome-content {
  max-width: 1000px;
  margin: 0 auto;
  padding-top: 60px;
}

.welcome-title {
  font-size: 28px;
  color: #303133;
  margin-bottom: 8px;
  text-align: center;
}

.welcome-desc {
  font-size: 16px;
  color: #909399;
  text-align: center;
  margin-bottom: 48px;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  .card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  p {
    color: #606266;
    line-height: 1.8;
    font-size: 14px;
  }
}
</style>
