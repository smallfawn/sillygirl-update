<template>
  <div class="storage-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>存储管理</span>
        </div>
      </template>
      <el-tabs v-model="activeBucket" type="card">
        <el-tab-pane v-for="bucket in buckets" :key="bucket" :label="bucket" :name="bucket">
          <el-table :data="bucketData" v-loading="loading" border>
            <el-table-column prop="key" label="键名" />
            <el-table-column prop="value" label="值" show-overflow-tooltip />
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    <el-dialog v-model="dialogVisible" title="编辑" width="500px">
      <el-form :model="form" label-width="60px">
        <el-form-item label="键名"><el-input v-model="form.key" disabled /></el-form-item>
        <el-form-item label="值"><el-input v-model="form.value" type="textarea" :rows="5" /></el-form-item>
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
import { getBuckets, getBucket, setBucketValue, deleteBucketKey } from '@/api/bucket'
const loading = ref(false)
const buckets = ref([])
const activeBucket = ref('')
const bucketData = ref([])
const dialogVisible = ref(false)
const form = ref({ key: '', value: '' })
const loadBuckets = async () => {
  const res = await getBuckets()
  buckets.value = res.data || []
  if (buckets.value.length > 0) {
    activeBucket.value = buckets.value[0]
    loadBucketData(buckets.value[0])
  }
}
const loadBucketData = async (name) => {
  loading.value = true
  const res = await getBucket(name)
  bucketData.value = res.data || []
  loading.value = false
}
const handleEdit = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}
const handleSave = async () => {
  await setBucketValue(activeBucket.value, form.value.key, form.value.value)
  ElMessage.success('保存成功')
  dialogVisible.value = false
  loadBucketData(activeBucket.value)
}
const handleDelete = async (row) => {
  await deleteBucketKey(activeBucket.value, row.key)
  ElMessage.success('删除成功')
  loadBucketData(activeBucket.value)
}
onMounted(loadBuckets)
</script>
