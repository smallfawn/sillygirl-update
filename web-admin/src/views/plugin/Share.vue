<template>
  <div class="share-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分享插件</span>
        </div>
      </template>
      
      <el-table :data="myPlugins" v-loading="loading" border>
        <el-table-column prop="title" label="插件名称" />
        <el-table-column prop="uuid" label="UUID" show-overflow-tooltip />
        <el-table-column label="分享状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.public ? 'success' : 'info'">
              {{ row.public ? '已公开' : '未公开' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleTogglePublic(row)">
              {{ row.public ? '取消分享' : '分享' }}
            </el-button>
            <el-button type="success" link @click="handleCopyLink(row)">复制链接</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPlugins } from '@/api/plugin'

const loading = ref(false)
const myPlugins = ref([])

const loadPlugins = async () => {
  loading.value = true
  try {
    const res = await getPlugins()
    myPlugins.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleTogglePublic = async (row) => {
  row.public = !row.public
  ElMessage.success(row.public ? '已公开分享' : '已取消分享')
}

const handleCopyLink = (row) => {
  const link = `${window.location.origin}/api/plugins/download/${row.uuid}`
  navigator.clipboard.writeText(link)
  ElMessage.success('链接已复制')
}

onMounted(loadPlugins)
</script>
