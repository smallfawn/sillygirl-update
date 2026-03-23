<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteTask, queryTasks, runTask, saveTask } from '../../api/tasks'

const state = reactive({
  loading: false,
  saving: false,
  runningId: '',
  deletingId: '',
  current: 1,
  pageSize: 10,
  total: 0,
  list: [],
})

const form = reactive({
  task_id: '',
  title: '',
  schedule: '0 * * * *',
  command: '',
  remark: '',
  enable: true,
})

async function fetchTasks() {
  state.loading = true
  try {
    const res = await queryTasks({
      current: state.current,
      pageSize: state.pageSize,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
  } catch (error) {
    ElMessage.error(error.message || '获取任务列表失败')
  } finally {
    state.loading = false
  }
}

function formatTime(unix) {
  if (!unix) return '-'
  const date = new Date(unix * 1000)
  return date.toLocaleString('zh-CN', { hour12: false })
}

async function submitTask() {
  if (!form.task_id || !form.title || !form.schedule || !form.command) {
    ElMessage.warning('请填写任务ID、名称、Cron 和指令')
    return
  }

  state.saving = true
  try {
    const payload = {
      task_id: form.task_id,
      title: form.title,
      schedule: form.schedule,
      command: form.command,
      remark: form.remark,
      enable: form.enable,
      senders: [],
      scripts: [],
    }
    const res = await saveTask(payload)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '保存任务失败')
    }
    ElMessage.success(`任务已保存：${form.task_id}`)
    await fetchTasks()
  } catch (error) {
    ElMessage.error(error.message || '保存任务失败')
  } finally {
    state.saving = false
  }
}

function editTask(task) {
  form.task_id = task.task_id || ''
  form.title = task.title || ''
  form.schedule = task.schedule || '0 * * * *'
  form.command = task.command || ''
  form.remark = task.remark || ''
  form.enable = Boolean(task.enable)
}

function resetForm() {
  form.task_id = ''
  form.title = ''
  form.schedule = '0 * * * *'
  form.command = ''
  form.remark = ''
  form.enable = true
}

async function handleRun(taskId) {
  state.runningId = taskId
  try {
    const res = await runTask(taskId)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '任务执行失败')
    }
    ElMessage.success(`任务已执行：${taskId}`)
  } catch (error) {
    ElMessage.error(error.message || '任务执行失败')
  } finally {
    state.runningId = ''
  }
}

async function handleDelete(taskId) {
  try {
    await ElMessageBox.confirm(`确定删除任务 ${taskId} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.deletingId = taskId
  try {
    const res = await deleteTask(taskId)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除失败')
    }
    ElMessage.success(`任务已删除：${taskId}`)
    await fetchTasks()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    state.deletingId = ''
  }
}

function handlePageChange(page) {
  state.current = page
  fetchTasks()
}

onMounted(fetchTasks)
</script>

<template>
  <section class="tasks-page">
    <el-row :gutter="12">
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="panel">
          <div class="panel-head">
            <div>
              <h3>任务配置</h3>
              <p class="hint">支持新增/编辑，Cron 语法与指令直填。</p>
            </div>
            <el-button text type="primary" @click="resetForm">清空</el-button>
          </div>

          <el-form :model="form" label-position="top" :disabled="state.saving">
            <el-form-item label="任务 ID">
              <el-input v-model.trim="form.task_id" placeholder="必填，如 task_001" />
            </el-form-item>
            <el-form-item label="任务名称">
              <el-input v-model.trim="form.title" placeholder="必填" />
            </el-form-item>
            <el-form-item label="Cron 表达式">
              <el-input v-model.trim="form.schedule" placeholder="如 0 * * * *" />
            </el-form-item>
            <el-form-item label="任务指令">
              <el-input v-model.trim="form.command" type="textarea" :rows="2" placeholder="执行指令" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model.trim="form.remark" placeholder="可选" />
            </el-form-item>
            <el-form-item>
              <el-switch v-model="form.enable" active-text="启用" inactive-text="停用" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="state.saving" @click="submitTask">保存</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="panel">
          <div class="panel-head">
            <div>
              <h3>任务列表</h3>
              <p class="hint">共 {{ state.total }} 条</p>
            </div>
            <el-button text :loading="state.loading" @click="fetchTasks">刷新</el-button>
          </div>

          <el-table :data="state.list" stripe v-loading="state.loading" style="width: 100%">
            <el-table-column prop="task_id" label="任务ID" width="140" />
            <el-table-column prop="title" label="名称" width="160" />
            <el-table-column prop="schedule" label="Cron" width="140" />
            <el-table-column prop="command" label="指令" show-overflow-tooltip />
            <el-table-column prop="remark" label="备注" show-overflow-tooltip width="140" />
            <el-table-column prop="enable" label="启用" width="80">
              <template #default="{ row }">
                <el-tag :type="row.enable ? 'success' : 'info'">{{ row.enable ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近执行" width="140">
              <template #default="{ row }">{{ formatTime(row.last_time) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-space>
                  <el-button size="small" @click="editTask(row)">编辑</el-button>
                  <el-button
                    size="small"
                    type="primary"
                    plain
                    :loading="state.runningId === row.task_id"
                    @click="handleRun(row.task_id)"
                  >执行</el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    :loading="state.deletingId === row.task_id"
                    @click="handleDelete(row.task_id)"
                  >删除</el-button>
                </el-space>
              </template>
            </el-table-column>
          </el-table>

          <div class="table-footer">
            <el-pagination
              background
              layout="prev, pager, next, jumper"
              :current-page="state.current"
              :page-size="state.pageSize"
              :total="state.total"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<style scoped>
.tasks-page {
  display: grid;
  gap: 12px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.panel h3 {
  margin: 0;
}

.hint {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
