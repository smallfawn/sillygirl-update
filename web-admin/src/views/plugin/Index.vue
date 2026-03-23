<template>
  <div class="plugin-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>插件管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增插件
          </el-button>
        </div>
      </template>
      
      <el-table :data="pluginList" v-loading="loading" border>
        <el-table-column prop="title" label="插件名称" min-width="150" />
        <el-table-column prop="uuid" label="UUID" min-width="200" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.enable"
              @change="(val) => handleToggle(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑插件' : '新增插件'"
      width="800px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="代码">
          <el-input
            v-model="form.code"
            type="textarea"
            :rows="15"
            placeholder="输入插件代码..."
          />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPlugins, savePlugin, deletePlugin, togglePlugin } from '@/api/plugin'

const loading = ref(false)
const pluginList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  uuid: '',
  title: '',
  code: ''
})

const loadPlugins = async () => {
  loading.value = true
  try {
    const res = await getPlugins()
    pluginList.value = res.data || []
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = { uuid: '', title: '', code: '' }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    await savePlugin(form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadPlugins()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定删除该插件吗？', '提示', { type: 'warning' })
    await deletePlugin(row.uuid)
    ElMessage.success('删除成功')
    loadPlugins()
  } catch (error) {
    console.error(error)
  }
}

const handleToggle = async (row, enable) => {
  try {
    await togglePlugin(row.uuid, enable)
    ElMessage.success(enable ? '已启用' : '已禁用')
  } catch (error) {
    row.enable = !enable
    console.error(error)
  }
}

onMounted(loadPlugins)
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
