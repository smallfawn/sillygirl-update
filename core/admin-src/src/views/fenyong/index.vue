<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span style="font-weight: 600; font-size: 16px;">返利统计</span>
      </template>

      <div class="search-bar">
        <el-radio-group v-model="timeRange" @change="loadData">
          <el-radio-button label="today">今天</el-radio-button>
          <el-radio-button label="yesterday">昨天</el-radio-button>
          <el-radio-button label="week">近7天</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="year">本年</el-radio-button>
        </el-radio-group>
        <el-select
          v-model="selectedUser"
          placeholder="全部用户"
          clearable
          style="width: 200px;"
          @change="loadData"
        >
          <el-option v-for="u in users" :key="u.value" :label="u.label" :value="u.value" />
        </el-select>
      </div>

      <div v-loading="loading" class="stats-content">
        <el-row :gutter="16" class="stats-cards">
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value">{{ stats.orders || 0 }}</div>
              <div class="stat-label">订单总数</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value">{{ stats.income || '0.00' }}</div>
              <div class="stat-label">总收入</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value">{{ stats.commission || '0.00' }}</div>
              <div class="stat-label">返利金额</div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-value">{{ stats.users || 0 }}</div>
              <div class="stat-label">用户数</div>
            </el-card>
          </el-col>
        </el-row>

        <el-table :data="detailList" border stripe style="margin-top: 20px;" max-height="500">
          <el-table-column prop="user" label="用户" min-width="120" />
          <el-table-column prop="orders" label="订单数" width="80" align="right" />
          <el-table-column prop="income" label="收入" width="120" align="right" />
          <el-table-column prop="commission" label="返利" width="120" align="right" />
          <el-table-column prop="rate" label="返利率" width="100" align="right" />
        </el-table>
        <el-empty v-if="detailList.length === 0 && !loading" description="暂无数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getStorage } from '@/api/storage'

const loading = ref(false)
const timeRange = ref('today')
const selectedUser = ref('')
const users = ref<{ label: string; value: string }[]>([])

const stats = reactive({
  orders: 0,
  income: '0.00',
  commission: '0.00',
  users: 0,
})

const detailList = ref<any[]>([])

async function loadData() {
  loading.value = true
  try {
    const keys = [
      `sillyGirl.fenyong.${timeRange.value}.orders`,
      `sillyGirl.fenyong.${timeRange.value}.income`,
      `sillyGirl.fenyong.${timeRange.value}.commission`,
    ].join(',')

    const res: any = await getStorage(keys)
    const data = res.data || {}
    stats.orders = Number(data[`sillyGirl.fenyong.${timeRange.value}.orders`]) || 0
    stats.income = data[`sillyGirl.fenyong.${timeRange.value}.income`] || '0.00'
    stats.commission = data[`sillyGirl.fenyong.${timeRange.value}.commission`] || '0.00'

    // 加载用户列表
    const usersRes: any = await getStorage('sillyGirl.fenyong.users')
    const usersVal = usersRes.data?.['sillyGirl.fenyong.users']
    if (usersVal) {
      users.value = usersVal.split('\n').filter((s: string) => s.trim()).map((s: string) => {
        const parts = s.split('|')
        return { label: parts[0] || s, value: parts[1] || s }
      })
    }
  } catch {
    // 返利模块可能未启用
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;

  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 14px;
    color: #909399;
  }
}
</style>
