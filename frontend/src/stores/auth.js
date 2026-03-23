import { defineStore } from 'pinia';
import { api } from '@/utils/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    profile: null,
    plugins: [],
    isReady: false,
    loading: false
  }),
  getters: {
    isLogin: (state) => !!state.profile
  },
  actions: {
    async bootstrap() {
      if (this.isReady) {
        return;
      }
      await this.fetchCurrentUser();
      this.isReady = true;
    },
    async login(payload) {
      const res = await api.post('/api/login/account', payload);
      if (res?.status === 'ok') {
        await this.fetchCurrentUser();
        return true;
      }
      return false;
    },
    async logout() {
      await api.post('/api/login/outLogin');
      this.profile = null;
      this.plugins = [];
      this.isReady = true;
    },
    async fetchCurrentUser() {
      this.loading = true;
      try {
        const res = await api.get('/api/currentUser');
        if (res?.success && res?.data) {
          this.profile = {
            name: res.data.name,
            avatar: res.data.avatar
          };
          this.plugins = Array.isArray(res.data.plugins) ? res.data.plugins : [];
        } else {
          this.profile = null;
          this.plugins = [];
        }
      } catch (error) {
        this.profile = null;
        this.plugins = [];
      } finally {
        this.loading = false;
      }
    }
  }
});
