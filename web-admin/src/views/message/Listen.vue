<template>
  <div class="listen-page">
    <el-card>
      <template #header>
        <div class="card-header"><span>消息监听</span></div>
      </template>
      <el-table :data="listenList" v-loading="loading" border>
        <el-table-column prop="chat_id" label="群聊ID" />
        <el-table-column prop="chat_name" label="群聊名称" />
        <el-table-column prop="platform" label="平台" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleRemove(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
const loading = ref(false)
const listenList = ref([])
const loadList = async () => {
  loading.value = true
  listenList.value = []
  loading.value = false
}
const handleRemove = (row) => {
  ElMessage.success('移除成功')
}
onMounted(loadList)
</script>
