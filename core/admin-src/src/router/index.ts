import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/index.vue'),
      meta: { title: '登录', noAuth: true },
    },
    {
      path: '/',
      component: () => import('@/components/AppLayout.vue'),
      children: [
        {
          path: '',
          name: 'Welcome',
          component: () => import('@/views/welcome/index.vue'),
          meta: { title: '欢迎' },
        },
        {
          path: 'basic',
          name: 'Basic',
          component: () => import('@/views/basic/index.vue'),
          meta: { title: '基础配置' },
        },
        {
          path: 'storage',
          name: 'Storage',
          component: () => import('@/views/storage/index.vue'),
          meta: { title: '存储管理' },
        },
        {
          path: 'script/:uuid',
          name: 'Script',
          component: () => import('@/views/script/index.vue'),
          meta: { title: '脚本编辑' },
        },
        {
          path: 'plugin/share',
          name: 'PluginShare',
          component: () => import('@/views/plugin/Share.vue'),
          meta: { title: '插件市场' },
        },
        {
          path: 'plugin/publish',
          name: 'PluginPublish',
          component: () => import('@/views/plugin/Publish.vue'),
          meta: { title: '插件发布' },
        },
        {
          path: 'plugin/subscribe',
          name: 'PluginSubscribe',
          component: () => import('@/views/plugin/Subscribe.vue'),
          meta: { title: '插件订阅' },
        },
        {
          path: 'reply',
          name: 'Reply',
          component: () => import('@/views/reply/index.vue'),
          meta: { title: '回复管理' },
        },
        {
          path: 'task',
          name: 'Task',
          component: () => import('@/views/task/index.vue'),
          meta: { title: '计划任务' },
        },
        {
          path: 'proxy',
          name: 'Proxy',
          component: () => import('@/views/proxy/index.vue'),
          meta: { title: '代理管理' },
        },
        {
          path: 'master',
          name: 'Master',
          component: () => import('@/views/master/index.vue'),
          meta: { title: '管理员管理' },
        },
        {
          path: 'message/listen',
          name: 'MessageListen',
          component: () => import('@/views/message/Listen.vue'),
          meta: { title: '消息监听' },
        },
        {
          path: 'message/noreply',
          name: 'MessageNoreply',
          component: () => import('@/views/message/Noreply.vue'),
          meta: { title: '不回复群' },
        },
        {
          path: 'message/private',
          name: 'MessagePrivate',
          component: () => import('@/views/message/Private.vue'),
          meta: { title: '屏蔽用户' },
        },
        {
          path: 'carry',
          name: 'Carry',
          component: () => import('@/views/carry/index.vue'),
          meta: { title: '消息搬运' },
        },
        {
          path: 'secret/fenyong',
          name: 'Fenyong',
          component: () => import('@/views/fenyong/index.vue'),
          meta: { title: '返利统计' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/404.vue'),
      meta: { title: '404' },
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  // 设置页面标题
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + '傻妞科技研究生产中心'

  // 无需认证的页面直接放行
  if (to.meta.noAuth) {
    next()
    return
  }

  // 检查是否已登录（简单检查：尝试获取用户信息）
  try {
    const res = await fetch('/api/currentUser', { credentials: 'include' })
    if (res.ok) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  } catch {
    next({ path: '/login', query: { redirect: to.fullPath } })
  }
})

export default router
