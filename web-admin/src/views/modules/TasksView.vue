<script setup>
import { onMounted, reactive } from 'vue'
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
  error: '',
  message: '',
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
  state.error = ''
  try {
    const res = await queryTasks({
      current: state.current,
      pageSize: state.pageSize,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
  } catch (error) {
    state.error = error.message || '获取任务列表失败'
  } finally {
    state.loading = false
  }
}

function formatTime(unix) {
  if (!unix) {
    return '-'
  }
  const date = new Date(unix * 1000)
  return date.toLocaleString('zh-CN', { hour12: false })
}

async function submitTask() {
  if (!form.task_id || !form.title || !form.schedule || !form.command) {
    state.error = '请至少填写任务ID、任务名称、Cron 表达式和指令'
    return
  }

  state.saving = true
  state.message = ''
  state.error = ''
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
    state.message = `任务已保存：${form.task_id}`
    await fetchTasks()
  } catch (error) {
    state.error = error.message || '保存任务失败'
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
  state.message = ''
  state.error = ''
  try {
    const res = await runTask(taskId)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '任务执行失败')
    }
    state.message = `任务已执行：${taskId}`
  } catch (error) {
    state.error = error.message || '任务执行失败'
  } finally {
    state.runningId = ''
  }
}

async function handleDelete(taskId) {
  if (!window.confirm(`确定删除任务 ${taskId} 吗？`)) {
    return
  }

  state.deletingId = taskId
  state.message = ''
  state.error = ''
  try {
    const res = await deleteTask(taskId)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除失败')
    }
    state.message = `任务已删除：${taskId}`
    await fetchTasks()
  } catch (error) {
    state.error = error.message || '删除失败'
  } finally {
    state.deletingId = ''
  }
}

function prevPage() {
  if (state.current <= 1) {
    return
  }
  state.current -= 1
  fetchTasks()
}

function nextPage() {
  const pageCount = Math.max(1, Math.ceil(state.total / state.pageSize))
  if (state.current >= pageCount) {
    return
  }
  state.current += 1
  fetchTasks()
}

onMounted(fetchTasks)
</script>

<template>
  <section class="tasks-page">
    <section class="panel">
      <h3>任务管理</h3>
      <p class="hint">支持任务列表查看、手动执行、删除，以及基础任务新增/编辑。</p>

      <div class="form-grid">
        <label>
          任务ID
          <input v-model.trim="form.task_id" placeholder="例如：daily-clean" />
        </label>
        <label>
          任务名称
          <input v-model.trim="form.title" placeholder="例如：每日清理" />
        </label>
        <label>
          Cron 表达式
          <input v-model.trim="form.schedule" placeholder="例如：0 * * * *" />
        </label>
        <label>
          备注
          <input v-model.trim="form.remark" placeholder="可选" />
        </label>
      </div>

      <label class="command-row">
        指令
        <textarea v-model.trim="form.command" rows="3" placeholder="任务触发时发送的命令" />
      </label>

      <label class="checkbox">
        <input v-model="form.enable" type="checkbox" />
        启用任务
      </label>

      <div class="actions">
        <button :disabled="state.saving" class="primary" @click="submitTask">
          {{ state.saving ? '保存中...' : '保存任务' }}
        </button>
        <button :disabled="state.saving" @click="resetForm">重置</button>
      </div>

      <p v-if="state.message" class="msg success">{{ state.message }}</p>
      <p v-if="state.error" class="msg error">{{ state.error }}</p>
    </section>

    <section class="panel">
      <div class="table-head">
        <strong>任务列表</strong>
        <span>共 {{ state.total }} 条</span>
      </div>

      <div v-if="state.loading" class="empty">加载中...</div>
      <div v-else-if="!state.list.length" class="empty">暂无任务</div>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>任务ID</th>
              <th>名称</th>
              <th>计划</th>
              <th>命令</th>
              <th>启用</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in state.list" :key="task.task_id">
              <td>{{ task.task_id }}</td>
              <td>{{ task.title }}</td>
              <td><code>{{ task.schedule }}</code></td>
              <td>{{ task.command }}</td>
              <td>{{ task.enable ? '是' : '否' }}</td>
              <td>{{ formatTime(task.created_at) }}</td>
              <td>
                <div class="row-actions">
                  <button @click="editTask(task)">编辑</button>
                  <button :disabled="state.runningId === task.task_id" @click="handleRun(task.task_id)">
                    {{ state.runningId === task.task_id ? '执行中' : '执行' }}
                  </button>
                  <button
                    class="danger"
                    :disabled="state.deletingId === task.task_id"
                    @click="handleDelete(task.task_id)"
                  >
                    {{ state.deletingId === task.task_id ? '删除中' : '删除' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="pager">
        <button :disabled="state.current <= 1 || state.loading" @click="prevPage">上一页</button>
        <span>第 {{ state.current }} 页</span>
        <button :disabled="state.current >= Math.ceil(state.total / state.pageSize) || state.loading" @click="nextPage">下一页</button>
      </footer>
    </section>
  </section>
</template>

<style scoped>
.tasks-page {
  display: grid;
  gap: 14px;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
}

h3 {
  margin: 0;
  color: #111827;
}

.hint {
  margin: 8px 0 14px;
  color: #6b7280;
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 10px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 13px;
}

input,
textarea {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

.command-row {
  margin-top: 10px;
}

.checkbox {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

button {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 7px 12px;
  background: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary {
  background: #7c3aed;
  border-color: #7c3aed;
  color: #fff;
}

.table-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #374151;
  font-size: 14px;
}

.table-wrap {
  overflow: auto;
}

table {
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f9fafb;
}

code {
  color: #5b21b6;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.danger {
  color: #b91c1c;
  border-color: #fecaca;
  background: #fef2f2;
}

.pager {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.msg {
  font-size: 13px;
  margin: 8px 0 0;
}

.msg.success {
  color: #047857;
}

.msg.error {
  color: #b91c1c;
}

.empty {
  color: #6b7280;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
