import axios from 'axios'

const request = axios.create({
  timeout: 15000,
  withCredentials: true,
})

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error?.response?.data?.errorMessage || error?.message || '请求失败'
    return Promise.reject(new Error(message))
  },
)

export default request
