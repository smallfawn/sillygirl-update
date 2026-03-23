import { defineStore } from 'pinia'
import { getCurrentUser, loginAccount, logout } from '../api/auth'

export const useUserStore = defineStore('user', {
  state: () => ({
    profile: null,
    loading: false,
  }),
  getters: {
    isLogin: (state) => Boolean(state.profile),
    displayName: (state) => state.profile?.name || '管理员',
  },
  actions: {
    async fetchCurrentUser() {
      this.loading = true
      try {
        const res = await getCurrentUser()
        if (res?.success && res?.data) {
          this.profile = res.data
          return this.profile
        }
        this.profile = null
        return null
      } catch (error) {
        this.profile = null
        return null
      } finally {
        this.loading = false
      }
    },
    async login(username, password) {
      const res = await loginAccount({ username, password })
      if (res?.status !== 'ok') {
        throw new Error('账号或密码错误')
      }
      return this.fetchCurrentUser()
    },
    async logout() {
      try {
        await logout()
      } finally {
        this.profile = null
      }
    },
  },
})
