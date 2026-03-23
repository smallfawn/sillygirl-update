<template>
  <div class="publish-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>发布插件</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="100px" class="publish-form">
        <el-form-item label="插件名称">
          <el-input v-model="form.name" placeholder="输入插件名称" />
        </el-form-item>
        <el-form-item label="插件描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="输入插件描述"
          />
        </el-form-item>
        <el-form-item label="插件代码">
          <el-input
            v-model="form.code"
            type="textarea"
            :rows="15"
            placeholder="输入插件代码..."
          />
        </el-form-item>
        <el-form-item label="是否公开">
          <el-switch v-model="form.public" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handlePublish">发布</el-button>
          <el-button @click="$router.push('/plugin')">返回</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { publishPlugin } from '@/api/plugin'

const router = useRouter()
const form = ref({
  name: '',
  description: '',
  code: '',
  public: true
})

const handlePublish = async () => {
  try {
    await publishPlugin(form.value)
    ElMessage.success('发布成功')
    router.push('/plugin')
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped>
.publish-form {
  max-width: 800px;
}
</style>
