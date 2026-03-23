<template>
  <div class="noreply-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>不回复列表</span>
          <el-button type="primary" @click="handleAdd">添加</el-button>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" border>
        <el-table-column prop="id" label="ID" />
        <el-table-column prop="type" label="类型" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleRemove(row)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="添加" width="400px">
      <el-form :model="form" label-width="60px">
        <el-form-item label="ID"><el-input v-model="form.id" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option label="用户" value="user" />
            <el-option label="群聊" value="group" />
          </el-select>
        </el-form-item>
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
const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const form = ref({ id: '', type: 'user' })
const loadList = async () => {
  loading.value = true
  list.value = []
  loading.value = false
}
const handleAdd = () => {
  form.value = { id: '', type: 'user' }
  dialogVisible.value = true
}
const handleSave = () => {
  ElMessage.success('添加成功')
  dialogVisible.value = false
}
const handleRemove = (row) => {
  ElMessage.success('移除成功')
}
onMounted(loadList)
</script>
