<template>
  <div class="reply-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>自动回复</span>
          <el-button type="primary" @click="handleAdd">新增规则</el-button>
        </div>
      </template>
      <el-table :data="replyList" v-loading="loading" border>
        <el-table-column prop="rule" label="匹配规则" />
        <el-table-column prop="content" label="回复内容" show-overflow-tooltip />
        <el-table-column prop="priority" label="优先级" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="编辑规则" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="匹配规则"><el-input v-model="form.rule" /></el-form-item>
        <el-form-item label="回复内容"><el-input v-model="form.content" type="textarea" :rows="4" /></el-form-item>
        <el-form-item label="优先级"><el-input-number v-model="form.priority" :min="0" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getReplies, saveReply, deleteReply } from '@/api/system'
const loading = ref(false)
const replyList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', rule: '', content: '', priority: 0 })
const loadReplies = async () => {
  loading.value = true
  const res = await getReplies()
  replyList.value = res.data || []
  loading.value = false
}
const handleAdd = () => {
  isEdit.value = false
  form.value = { id: '', rule: '', content: '', priority: 0 }
  dialogVisible.value = true
}
const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}
const handleSave = async () => {
  await saveReply(form.value)
  ElMessage.success('保存成功')
  dialogVisible.value = false
  loadReplies()
}
const handleDelete = async (row) => {
  await deleteReply(row.id)
  ElMessage.success('删除成功')
  loadReplies()
}
onMounted(loadReplies)
</script>
