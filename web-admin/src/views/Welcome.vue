<template>
  <div class="welcome-page">
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <h1>欢迎使用傻妞管理面板</h1>
          <p class="subtitle">一个不太有用的机器人，不生产消息，只搬运消息。</p>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.plugins }}</div>
            <div class="stat-label">插件数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.messages }}</div>
            <div class="stat-label">消息数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon><Timer /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.tasks }}</div>
            <div class="stat-label">定时任务</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #F56C6C;">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.adapters }}</div>
            <div class="stat-label">机器人数量</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card title="系统信息">
          <template #header>
            <div class="card-header">
              <span>系统信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统版本">{{ system.version }}</el-descriptions-item>
            <el-descriptions-item label="运行时间">{{ system.uptime }}</el-descriptions-item>
            <el-descriptions-item label="内存使用">{{ system.memory }}</el-descriptions-item>
            <el-descriptions-item label="HTTP端口">{{ system.port }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快速链接</span>
            </div>
          </template>
          <div class="quick-links">
            <el-button type="primary" @click="$router.push('/plugin')">插件管理</el-button>
            <el-button type="success" @click="$router.push('/storage')">存储管理</el-button>
            <el-button type="warning" @click="$router.push('/task')">任务管理</el-button>
            <el-button type="danger" @click="$router.push('/reply')">自动回复</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const stats = ref({
  plugins: 0,
  messages: 0,
  tasks: 0,
  adapters: 0
})

const system = ref({
  version: '1.0.0',
  uptime: '0天0小时',
  memory: '0MB',
  port: 8080
})

onMounted(async () => {
  // 这里加载统计数据
})
</script>

<style scoped>
.welcome-page {
  padding: 0;
}

.welcome-card {
  text-align: center;
  padding: 40px 0;
}

.welcome-card h1 {
  font-size: 28px;
  color: #303133;
  margin-bottom: 10px;
}

.subtitle {
  color: #909399;
  font-size: 14px;
}

.mt-20 {
  margin-top: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon .el-icon {
  font-size: 30px;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  font-weight: 600;
}

.quick-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-links .el-button {
  flex: 1;
  min-width: 100px;
}
</style>
