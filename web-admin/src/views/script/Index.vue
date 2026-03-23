<template>
  <div class="script-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>脚本编辑</span>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </div>
      </template>
      <el-input v-model="code" type="textarea" :rows="25" placeholder="输入JavaScript代码..." />
    </el-card>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
const code = ref('')
const handleSave = () => {
  ElMessage.success('保存成功')
}
onMounted(() => {
  code.value = `/**
 * @title 示例脚本
 * @rule 你好
 */

s.reply("Hello World!");
`
})
</script>
