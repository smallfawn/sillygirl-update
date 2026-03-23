<template>
  <div class="subscribe-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>订阅插件</span>
        </div>
      </template>
      
      <el-form :model="form" label-width="100px">
        <el-form-item label="订阅地址">
          <el-input v-model="form.url" placeholder="输入插件订阅地址" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubscribe">订阅</el-button>
        </el-form-item>
      </el-form>
      
      <el-divider />
      
      <h4>公开插件列表</h4>
      <el-table :data="publicPlugins" v-loading="loading" border class="mt-20">
        <el-table-column prop="name" label="插件名称" />
        <el-table-column prop="author" label="作者" />
        <el-table-column prop="downloads" label="下载量" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleDownload(row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPublicPlugins, subscribePlugin, downloadPlugin } from '@/api/plugin'

const loading = ref(false)
const publicPlugins = ref([])
const form = ref({ url: '' })

const loadPublicPlugins = async () => {
  loading.value = true
  try {
    const res = await getPublicPlugins()
    publicPlugins.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSubscribe = async () => {
  try {
    await subscribePlugin(form.value)
    ElMessage.success('订阅成功')
  } catch (error) {
    console.error(error)
  }
}

const handleDownload = async (row) => {
  try {
    await downloadPlugin(row.uuid)
    ElMessage.success('下载成功')
  } catch (error) {
    console.error(error)
  }
}

onMounted(loadPublicPlugins)
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
}
</style>
