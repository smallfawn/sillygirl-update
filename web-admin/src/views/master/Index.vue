<template>
  <div class="master-page">
    <el-card>
      <template #header>
        <div class="card-header"><span>管理员设置</span></div>
      </template>
      <el-form :model="form" label-width="100px">
        <el-form-item label="管理员账号">
          <el-select v-model="form.masters" multiple filterable allow-create default-first-option placeholder="输入管理员ID" style="width: 100%">
            <el-option v-for="item in form.masters" :key="item" :label="item" :value="item" />
          </el-select>
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
const form = ref({ masters: [] })
const loadMasters = async () => {
  const res = await getBucket('qq')
  if (res.data) {
    const mastersStr = res.data.find(item => item.key === 'masters')?.value || ''
    form.value.masters = mastersStr.split('&').filter(Boolean)
  }
}
const handleSave = async () => {
  await setBucketValue('qq', 'masters', form.value.masters.join('&'))
  ElMessage.success('保存成功')
}
onMounted(loadMasters)
</script>
