<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-weight: 600; font-size: 16px;">消息搬运</span>
          <el-button type="primary" size="small" @click="showDialog()">
            <el-icon><Plus /></el-icon> 新增搬运群
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" border stripe v-loading="loading">
        <el-table-column prop="chat_id" label="群ID" min-width="140" />
        <el-table-column prop="chat_name" label="群名" min-width="150" show-overflow-tooltip />
        <el-table-column prop="platform" label="平台" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.platform }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="采集" width="60" align="center">
          <template #default="{ row }">
            <el-tag :type="row.in ? 'success' : 'info'" size="small">
              {{ row.in ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="转发" width="60" align="center">
          <template #default="{ row }">
            <el-tag :type="row.out ? 'success' : 'info'" size="small">
              {{ row.out ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column prop="enable" label="状态" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enable ? 'success' : 'info'" size="small">
              {{ row.enable ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
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
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑搬运群' : '新增搬运群'" width="720px" top="5vh">
      <el-form :model="editForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="群ID" required>
              <el-input v-model="editForm.chat_id" :disabled="isEdit" placeholder="输入群ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="群名">
              <el-input v-model="editForm.chat_name" placeholder="群名称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="采集群">
              <el-switch v-model="editForm.in" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="转发群">
              <el-switch v-model="editForm.out" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="启用">
              <el-switch v-model="editForm.enable" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="平台">
          <el-select v-model="editForm.platform" placeholder="选择平台">
            <el-option v-for="p in selects.platforms" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>

        <el-form-item label="采集源">
          <el-select v-model="editForm.from" multiple placeholder="选择采集源群" style="width: 100%;">
            <el-option v-for="(name, id) in selects.group_names" :key="id" :label="name" :value="id" />
          </el-select>
        </el-form-item>

        <el-form-item label="白名单">
          <el-select v-model="editForm.allowed" multiple placeholder="选择用户" style="width: 100%;">
            <el-option v-for="u in selects.user_names" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="黑名单">
          <el-select v-model="editForm.prohibited" multiple placeholder="选择用户" style="width: 100%;">
            <el-option v-for="u in selects.user_names" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="包含关键词">
          <el-select v-model="editForm.include" multiple filterable allow-create default-first-option
            placeholder="输入关键词后回车" style="width: 100%;" />
        </el-form-item>

        <el-form-item label="排除关键词">
          <el-select v-model="editForm.exclude" multiple filterable allow-create default-first-option
            placeholder="输入关键词后回车" style="width: 100%;" />
        </el-form-item>

        <el-form-item label="Bot ID">
          <el-select v-model="editForm.bots_id" multiple placeholder="选择 Bot" style="width: 100%;">
            <el-option v-for="b in selects.bots_id" :key="b" :label="b" :value="b" />
          </el-select>
        </el-form-item>

        <el-form-item label="处理脚本">
          <el-select v-model="editForm.scripts" multiple placeholder="选择脚本" style="width: 100%;">
            <el-option v-for="(name, uuid) in selects.scripts" :key="uuid" :label="name" :value="uuid" />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="文本去重">
              <el-switch v-model="editForm.deduplication" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图片去重">
              <el-switch v-model="editForm.deduplication2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
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
import { getCarryGroups, getCarryGroupSelects, saveCarryGroup, deleteCarryGroup } from '@/api/carry'

const loading = ref(false)
const saving = ref(false)
const current = ref(1)
const total = ref(0)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)

const selects = reactive<any>({
  user_names: [],
  group_names: {},
  bots_id: [],
  platforms: [],
  scripts: {},
})

const defaultForm = () => ({
  chat_id: '',
  chat_name: '',
  platform: '',
  in: true,
  out: false,
  from: [] as string[],
  allowed: [] as string[],
  prohibited: [] as string[],
  include: [] as string[],
  exclude: [] as string[],
  bots_id: [] as string[],
  scripts: [] as string[],
  deduplication: false,
  deduplication2: false,
  enable: true,
  remark: '',
})

const editForm = reactive(defaultForm())
const isEdit = computed(() => !!editForm.chat_id)

async function loadData() {
  loading.value = true
  try {
    const res: any = await getCarryGroups(current.value)
    tableData.value = res.data || []
    total.value = res.total || 0
  } catch {} finally {
    loading.value = false
  }
}

async function loadSelects(chatId: string) {
  try {
    const res: any = await getCarryGroupSelects(chatId)
    if (res.data) {
      selects.user_names = res.data.user_names || []
      selects.group_names = res.data.group_names || {}
      selects.bots_id = res.data.bots_id || []
      selects.platforms = res.data.platforms || []
      selects.scripts = res.data.scripts || {}
    }
  } catch {}
}

function showDialog(row?: any) {
  if (row) {
    Object.assign(editForm, {
      chat_id: row.chat_id,
      chat_name: row.chat_name,
      platform: row.platform,
      in: row.in,
      out: row.out,
      from: [...(row.from || [])],
      allowed: [...(row.allowed || [])],
      prohibited: [...(row.prohibited || [])],
      include: [...(row.include || [])],
      exclude: [...(row.exclude || [])],
      bots_id: [...(row.bots_id || [])],
      scripts: [...(row.scripts || [])],
      deduplication: row.deduplication,
      deduplication2: row.deduplication2,
      enable: row.enable,
      remark: row.remark,
    })
    loadSelects(row.chat_id)
  } else {
    Object.assign(editForm, defaultForm())
    loadSelects('')
  }
  dialogVisible.value = true
}

async function handleSave() {
  if (!editForm.chat_id) {
    ElMessage.warning('请输入群ID')
    return
  }
  saving.value = true
  try {
    await saveCarryGroup({ ...editForm })
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    dialogVisible.value = false
    loadData()
  } catch {} finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除搬运群「${row.chat_name || row.chat_id}」？`, '警告', { type: 'warning' })
    await deleteCarryGroup(row.chat_id)
    ElMessage.success('删除成功')
    loadData()
  } catch { /* 取消 */ }
}

onMounted(() => {
  loadData()
})
</script>
