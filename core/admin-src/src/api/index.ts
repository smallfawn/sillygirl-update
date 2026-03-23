import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 认证失败
    if (res.errorCode === '401') {
      // 跳转登录
      window.location.href = '/admin/user/login'
      return Promise.reject(new Error(res.errorMessage || '请先登录'))
    }
    if (res.success === false && res.errorMessage) {
      ElMessage.error(res.errorMessage)
      return Promise.reject(new Error(res.errorMessage))
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/admin/user/login'
      return Promise.reject(error)
    }
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

export default request
