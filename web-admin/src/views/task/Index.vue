<template>
  <div class="task-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务管理</span>
          <el-button type="primary" @click="handleAdd">新增任务</el-button>
        </div>
      </template>
      <el-table :data="taskList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="cron" label="Cron表达式" width="150" />
        <el-table-column prop="desc" label="描述" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.running ? 'success' : 'info'">
              {{ row.running ? '运行中' : '已停止' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="新增任务" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="Cron表达式">
          <el-input v-model="form.cron" placeholder="* * * * * *" />
        </el-form-item>
        <el-form-item label="任务描述"><el-input v-model="form.desc" /></el-form-item>
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
import { getTasks, addTask, removeTask } from '@/api/system'
const loading = ref(false)
const taskList = ref([])
const dialogVisible = ref(false)
const form = ref({ cron: '', desc: '' })
const loadTasks = async () => {
  loading.value = true
  const res = await getTasks()
  taskList.value = res.data || []
  loading.value = false
}
const handleAdd = () => {
  form.value = { cron: '', desc: '' }
  dialogVisible.value = true
}
const handleSave = async () => {
  await addTask(form.value)
  ElMessage.success('添加成功')
  dialogVisible.value = false
  loadTasks()
}
const handleDelete = async (row) => {
  await removeTask(row.id)
  ElMessage.success('删除成功')
  loadTasks()
}
onMounted(loadTasks)
</script>
