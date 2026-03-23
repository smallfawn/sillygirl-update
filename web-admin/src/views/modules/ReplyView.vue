<script setup>
import { onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteReply, queryReplyList, saveReply } from '../../api/reply'

const state = reactive({
  loading: false,
  saving: false,
  deletingId: null,
  current: 1,
  pageSize: 10,
  total: 0,
  list: [],
  keyword: '',
  value: '',
  number: '',
  platforms: [],
})

const form = reactive({
  id: '',
  number: '',
  nickname: '',
  keyword: '',
  value: '',
  priority: 100,
  platformsText: '',
})

async function fetchList() {
  state.loading = true
  try {
    const res = await queryReplyList({
      current: state.current,
      pageSize: state.pageSize,
      keyword: state.keyword,
      value: state.value,
      number: state.number,
    })
    state.list = Array.isArray(res?.data) ? res.data : []
    state.total = Number(res?.total || 0)
    state.platforms = Array.isArray(res?.platforms) ? res.platforms : []
  } catch (error) {
    ElMessage.error(error.message || '获取自动回复列表失败')
  } finally {
    state.loading = false
  }
}

function parsePlatforms(text) {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function resetForm() {
  form.id = ''
  form.number = ''
  form.nickname = ''
  form.keyword = ''
  form.value = ''
  form.priority = 100
  form.platformsText = ''
}

function editRule(item) {
  form.id = item.id
  form.number = item.number || ''
  form.nickname = item.nickname || ''
  form.keyword = item.keyword || ''
  form.value = item.value || ''
  form.priority = Number(item.priority || 100)
  form.platformsText = Array.isArray(item.platforms) ? item.platforms.join(',') : ''
}

async function submitRule() {
  if (!form.keyword || !form.value) {
    ElMessage.warning('请填写关键词和回复内容')
    return
  }

  state.saving = true
  try {
    const payload = {
      id: Number(form.id || 0),
      number: form.number,
      nickname: form.nickname,
      keyword: form.keyword,
      value: form.value,
      priority: Number(form.priority || 0),
      platforms: parsePlatforms(form.platformsText),
    }
    const res = await saveReply(payload)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '保存失败')
    }
    ElMessage.success(payload.id ? `规则已更新：#${payload.id}` : '规则已新增')
    await fetchList()
    if (!payload.id) resetForm()
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    state.saving = false
  }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm(`确定删除规则 #${id} 吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch (e) {
    return
  }

  state.deletingId = id
  try {
    const res = await deleteReply(id)
    if (!res?.success) {
      throw new Error(res?.errorMessage || '删除失败')
    }
    ElMessage.success(`规则已删除：#${id}`)
    await fetchList()
  } catch (error) {
    ElMessage.error(error.message || '删除失败')
  } finally {
    state.deletingId = null
  }
}

function handleSearch() {
  state.current = 1
  fetchList()
}

function handleResetSearch() {
  state.keyword = ''
  state.value = ''
  state.number = ''
  state.current = 1
  fetchList()
}

function handlePageChange(page) {
  state.current = page
  fetchList()
}

onMounted(fetchList)
</script>

<template>
  <section class="reply-page">
    <el-card shadow="never" class="panel">
      <div class="panel-head">
        <div>
          <h3>自动回复规则</h3>
          <p class="hint">支持规则检索、新增、编辑和删除。平台用英文逗号分隔（如 wx,qq,tg）。</p>
        </div>
        <el-space>
          <el-button text @click="handleResetSearch">重置</el-button>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-space>
      </div>

      <el-row :gutter="12" class="search-row">
        <el-col :xs="24" :sm="8">
          <el-input v-model.trim="state.keyword" placeholder="关键词" clearable />
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-input v-model.trim="state.value" placeholder="回复内容" clearable />
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-input v-model.trim="state.number" placeholder="号码（精确）" clearable />
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="12">
      <el-col :xs="24" :md="10">
        <el-card shadow="never" class="panel">
          <div class="panel-head">
            <div>
              <h4>新增 / 编辑规则</h4>
              <p class="hint">规则ID留空表示新增。</p>
            </div>
            <el-button text type="primary" @click="resetForm">清空</el-button>
          </div>

          <el-form :model="form" label-position="top" :disabled="state.saving">
            <el-form-item label="规则 ID（编辑时填写）">
              <el-input v-model.trim="form.id" placeholder="留空表示新增" />
            </el-form-item>
            <el-form-item label="号码">
              <el-input v-model.trim="form.number" placeholder="可选，限定用户/群" />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model.trim="form.nickname" placeholder="可选" />
            </el-form-item>
            <el-form-item label="优先级">
              <el-input-number v-model="form.priority" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model.trim="form.keyword" placeholder="触发关键词" />
            </el-form-item>
            <el-form-item label="回复内容">
              <el-input v-model.trim="form.value" type="textarea" :rows="2" placeholder="回复内容" />
            </el-form-item>
            <el-form-item label="平台">
              <el-input v-model.trim="form.platformsText" placeholder="如 wx,qq,tg" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="state.saving" @click="submitRule">保存</el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="14">
        <el-card shadow="never" class="panel">
          <div class="panel-head">
            <div>
              <h4>规则列表</h4>
              <p class="hint">共 {{ state.total }} 条</p>
            </div>
            <el-button text :loading="state.loading" @click="fetchList">刷新</el-button>
          </div>

          <el-table :data="state.list" stripe v-loading="state.loading" style="width: 100%">
            <el-table-column prop="id" label="#" width="80" />
            <el-table-column prop="number" label="号码" width="140" />
            <el-table-column prop="nickname" label="昵称" width="140" />
            <el-table-column prop="keyword" label="关键词" width="160" />
            <el-table-column prop="value" label="回复内容" show-overflow-tooltip />
            <el-table-column prop="priority" label="优先级" width="90" />
            <el-table-column label="平台" width="140">
              <template #default="{ row }">
                <el-tag v-for="p in row.platforms || []" :key="p" type="info" effect="plain" style="margin: 2px">{{ p }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-space>
                  <el-button size="small" @click="editRule(row)">编辑</el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    :loading="state.deletingId === row.id"
                    @click="handleDelete(row.id)"
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
.reply-page {
  display: grid;
  gap: 12px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.panel h3,
.panel h4 {
  margin: 0;
}

.hint {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.search-row {
  margin-top: 8px;
}

.table-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
