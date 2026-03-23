import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'layout',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/views/HomeView.vue')
      },
      {
        path: 'script/:id',
        name: 'script',
        component: () => import('@/views/ScriptView.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (!authStore.isReady) {
    await authStore.bootstrap();
  }

  if (to.meta.public) {
    return true;
  }

  if (!authStore.isLogin) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  return true;
});

export default router;
