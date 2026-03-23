<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">计划任务</span>
          <el-button type="primary" size="small" @click="showDialog()">
            <el-icon><Plus /></el-icon> 新增任务
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="title" label="任务名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="task_id" label="任务ID" min-width="120" show-overflow-tooltip />
        <el-table-column prop="schedule" label="Cron 表达式" width="150" />
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="enable" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enable ? 'success' : 'info'" size="small">
              {{ row.enable ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" text @click="handleRun(row)">执行</el-button>
            <el-button type="primary" size="small" text @click="showDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" text @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="current"
          :page-size="20"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editForm.task_id && !isNew ? '编辑任务' : '新增任务'" width="640px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="任务ID" required>
          <el-input v-model="editForm.task_id" :disabled="!isNew" placeholder="唯一标识" />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="editForm.title" placeholder="任务名称" />
        </el-form-item>
        <el-form-item label="Cron 表达式" required>
          <el-input v-model="editForm.schedule" placeholder="如: 0 */1 * * * (每小时)" />
        </el-form-item>
        <el-form-item label="触发指令">
          <el-input v-model="editForm.command" placeholder="触发的消息指令" />
        </el-form-item>
        <el-form-item label="执行脚本">
          <el-select v-model="editForm.scripts" multiple placeholder="选择脚本" style="width: 100%;">
            <el-option v-for="(name, uuid) in scriptOptions" :key="uuid" :label="name" :value="uuid" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行环境">
          <el-row :gutter="12" style="width: 100%;">
            <el-col :span="12">
              <el-select :model-value="editForm.senders[0]?.user_id" placeholder="用户ID" clearable
                @update:model-value="val => { if (editForm.senders[0]) editForm.senders[0].user_id = val }">
                <el-option v-for="u in selectData.user_names" :key="u.value" :label="u.label" :value="u.value" />
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-select :model-value="editForm.senders[0]?.chat_id" placeholder="群ID" clearable
                @update:model-value="val => { if (editForm.senders[0]) editForm.senders[0].chat_id = val }">
                <el-option v-for="g in selectData.group_names" :key="g.value" :label="g.label" :value="g.value" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="editForm.enable" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getTasks, saveTask, deleteTask, runTask, getTaskSelects } from '@/api/task'

const loading = ref(false)
const saving = ref(false)
const current = ref(1)
const total = ref(0)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)

const selectData = reactive<any>({
  scripts: {},
  platforms: {},
  user_names: [],
  group_names: [],
})

const editForm = reactive({
  task_id: '',
  title: '',
  schedule: '',
  command: '',
  scripts: [] as string[],
  senders: [{ chat_id: '', user_id: '', platform: '', bot_id: '' }],
  remark: '',
  enable: true,
})

const isNew = computed(() => !editForm.task_id)
const scriptOptions = computed(() => selectData.scripts)

async function loadData() {
  loading.value = true
  try {
    const res: any = await getTasks(current.value)
    tableData.value = res.data || []
    total.value = res.total || 0
  } catch {} finally {
    loading.value = false
  }
}

async function loadSelects(taskId?: string) {
  try {
    const res: any = await getTaskSelects(taskId)
    if (res.data) {
      Object.assign(selectData, res.data)
    }
  } catch {}
}

function showDialog(row?: any) {
  if (row) {
    editForm.task_id = row.task_id
    editForm.title = row.title
    editForm.schedule = row.schedule
    editForm.command = row.command
    editForm.scripts = [...(row.scripts || [])]
    editForm.senders = row.senders?.length > 0 ? [...row.senders] : [{ chat_id: '', user_id: '', platform: '', bot_id: '' }]
    editForm.remark = row.remark
    editForm.enable = row.enable
    loadSelects(row.task_id)
  } else {
    editForm.task_id = ''
    editForm.title = ''
    editForm.schedule = ''
    editForm.command = ''
    editForm.scripts = []
    editForm.senders = [{ chat_id: '', user_id: '', platform: '', bot_id: '' }]
    editForm.remark = ''
    editForm.enable = true
    loadSelects()
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!editForm.task_id || !editForm.schedule) {
    ElMessage.warning('任务ID 和 Cron 表达式不能为空')
    return
  }
  saving.value = true
  try {
    await saveTask({ ...editForm })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    loadData()
  } catch {} finally {
    saving.value = false
  }
}

async function handleRun(row: any) {
  try {
    await ElMessageBox.confirm(`确定执行任务「${row.title || row.task_id}」？`, '提示')
    await runTask(row.task_id)
    ElMessage.success('执行成功')
  } catch { /* 取消 */ }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定删除该任务？', '警告', { type: 'warning' })
    await deleteTask(row.task_id)
    ElMessage.success('删除成功')
    loadData()
  } catch { /* 取消 */ }
}

onMounted(() => {
  loadData()
})
</script>
