<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <p>页面被喵咪劫走了</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.content h1 {
  font-size: 120px;
  color: #409EFF;
  margin-bottom: 20px;
}

.content p {
  font-size: 20px;
  color: #909399;
  margin-bottom: 30px;
}
</style>
