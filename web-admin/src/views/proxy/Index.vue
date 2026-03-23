<template>
  <div class="proxy-page">
    <el-card>
      <template #header>
        <div class="card-header"><span>代理设置</span></div>
      </template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="HTTP代理">
          <el-input v-model="form.http_proxy" placeholder="http://127.0.0.1:7890" />
        </el-form-item>
        <el-form-item label="HTTPS代理">
          <el-input v-model="form.https_proxy" placeholder="https://127.0.0.1:7890" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getBucket, setBucketValue } from '@/api/bucket'
const form = ref({ http_proxy: '', https_proxy: '' })
const loadSettings = async () => {
  const res = await getBucket('app')
  if (res.data) {
    form.value.http_proxy = res.data.find(item => item.key === 'http_proxy')?.value || ''
    form.value.https_proxy = res.data.find(item => item.key === 'https_proxy')?.value || ''
  }
}
const handleSave = async () => {
  await setBucketValue('app', 'http_proxy', form.value.http_proxy)
  await setBucketValue('app', 'https_proxy', form.value.https_proxy)
  ElMessage.success('保存成功')
}
onMounted(loadSettings)
</script>
