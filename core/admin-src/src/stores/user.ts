import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCurrentUser, login, logout } from '@/api/auth'

interface PluginRoute {
  path: string
  name: string
  component?: string
  create_at?: string
}

interface UserInfo {
  name: string
  avatar: string
  plugins?: PluginRoute[]
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const isLoggedIn = ref(false)
  const dynamicRoutes = ref<PluginRoute[]>([])

  async function fetchCurrentUser() {
    try {
      const res: any = await getCurrentUser()
      userInfo.value = res.data
      isLoggedIn.value = true
      dynamicRoutes.value = res.data?.plugins || []
      return res.data
    } catch {
      isLoggedIn.value = false
      userInfo.value = null
      dynamicRoutes.value = []
      return null
    }
  }

  async function loginAction(username: string, password: string) {
    const res: any = await login({ username, password })
    if (res.status === 'ok') {
      isLoggedIn.value = true
      await fetchCurrentUser()
      return true
    }
    return false
  }

  async function logoutAction() {
    try {
      await logout()
    } finally {
      isLoggedIn.value = false
      userInfo.value = null
      dynamicRoutes.value = []
    }
  }

  return {
    userInfo,
    isLoggedIn,
    dynamicRoutes,
    fetchCurrentUser,
    loginAction,
    logoutAction,
  }
})
