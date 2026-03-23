import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/dashboard',
      },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('../views/DashboardView.vue'),
      },
      {
        path: 'storage',
        name: 'storage',
        component: () => import('../views/modules/StorageView.vue'),
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('../views/modules/TasksView.vue'),
      },
      {
        path: 'reply',
        name: 'reply',
        component: () => import('../views/modules/ReplyView.vue'),
      },
      {
        path: 'carry',
        name: 'carry',
        component: () => import('../views/modules/CarryView.vue'),
      },
      {
        path: 'masters',
        name: 'masters',
        component: () => import('../views/modules/MastersView.vue'),
      },
      {
        path: 'plugins',
        name: 'plugins',
        component: () => import('../views/modules/PluginsView.vue'),
      },
      {
        path: 'proxy',
        name: 'proxy',
        component: () => import('../views/modules/ProxyView.vue'),
      },
      {
        path: 'script/:uuid?',
        name: 'script-editor',
        component: () => import('../views/modules/ScriptEditorView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes,
})

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  if (to.meta.public) {
    if (!userStore.isLogin) {
      return true
    }
    return to.query.redirect ? String(to.query.redirect) : '/dashboard'
  }

  if (!userStore.isLogin) {
    const profile = await userStore.fetchCurrentUser()
    if (!profile) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }
  }

  return true
})

export default router
