<template>
  <div class="fenyong-page">
    <el-card>
      <template #header>
        <div class="card-header"><span>分佣设置</span></div>
      </template>
      <el-form :model="form" label-width="120px">
        <el-form-item label="分佣比例(%)">
          <el-input-number v-model="form.ratio" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="分佣开关">
          <el-switch v-model="form.enabled" />
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
const form = ref({ ratio: 0, enabled: false })
const loadSettings = async () => {
  const res = await getBucket('fenyong')
  if (res.data) {
    form.value.ratio = parseInt(res.data.find(item => item.key === 'ratio')?.value || '0')
    form.value.enabled = res.data.find(item => item.key === 'enabled')?.value === 'true'
  }
}
const handleSave = async () => {
  await setBucketValue('fenyong', 'ratio', form.value.ratio.toString())
  await setBucketValue('fenyong', 'enabled', form.value.enabled.toString())
  ElMessage.success('保存成功')
}
onMounted(loadSettings)
</script>
