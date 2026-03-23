<template>
  <div class="carry-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>消息搬运</span>
          <el-button type="primary" @click="handleAdd">新增规则</el-button>
        </div>
      </template>
      <el-table :data="carryList" v-loading="loading" border>
        <el-table-column prop="from" label="来源" />
        <el-table-column prop="to" label="目标" />
        <el-table-column prop="pattern" label="匹配模式" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="dialogVisible" title="编辑搬运规则" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="来源"><el-input v-model="form.from" /></el-form-item>
        <el-form-item label="目标"><el-input v-model="form.to" /></el-form-item>
        <el-form-item label="匹配模式"><el-input v-model="form.pattern" /></el-form-item>
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
import { getCarries, saveCarry, deleteCarry } from '@/api/system'
const loading = ref(false)
const carryList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({ id: '', from: '', to: '', pattern: '' })
const loadCarries = async () => {
  loading.value = true
  const res = await getCarries()
  carryList.value = res.data || []
  loading.value = false
}
const handleAdd = () => {
  isEdit.value = false
  form.value = { id: '', from: '', to: '', pattern: '' }
  dialogVisible.value = true
}
const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}
const handleSave = async () => {
  await saveCarry(form.value)
  ElMessage.success('保存成功')
  dialogVisible.value = false
  loadCarries()
}
const handleDelete = async (row) => {
  await deleteCarry(row.id)
  ElMessage.success('删除成功')
  loadCarries()
}
onMounted(loadCarries)
</script>
