<template>
  <div class="private-page">
    <el-card>
      <template #header>
        <div class="card-header"><span>私聊管理</span></div>
      </template>
      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="user_id" label="用户ID" />
        <el-table-column prop="user_name" label="用户名" />
        <el-table-column prop="last_message" label="最后消息" show-overflow-tooltip />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleReply(row)">回复</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="回复消息" width="500px">
      <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="输入回复内容..." />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSend">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const replyContent = ref('')
const currentRow = ref(null)
const loadList = async () => {
  loading.value = true
  list.value = []
  loading.value = false
}
const handleReply = (row) => {
  currentRow.value = row
  replyContent.value = ''
  dialogVisible.value = true
}
const handleSend = () => {
  ElMessage.success('发送成功')
  dialogVisible.value = false
}
onMounted(loadList)
</script>
