import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/views/Layout.vue'),
    redirect: '/welcome',
    children: [
      {
        path: 'welcome',
        name: 'Welcome',
        component: () => import('@/views/Welcome.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'plugin',
        name: 'Plugin',
        component: () => import('@/views/plugin/Index.vue'),
        meta: { title: '插件管理', icon: 'Box' }
      },
      {
        path: 'plugin/publish',
        name: 'PluginPublish',
        component: () => import('@/views/plugin/Publish.vue'),
        meta: { title: '发布插件', icon: 'Upload' }
      },
      {
        path: 'plugin/subscribe',
        name: 'PluginSubscribe',
        component: () => import('@/views/plugin/Subscribe.vue'),
        meta: { title: '订阅插件', icon: 'Download' }
      },
      {
        path: 'plugin/share',
        name: 'PluginShare',
        component: () => import('@/views/plugin/Share.vue'),
        meta: { title: '分享插件', icon: 'Share' }
      },
      {
        path: 'carry',
        name: 'Carry',
        component: () => import('@/views/carry/Index.vue'),
        meta: { title: '消息搬运', icon: 'Switch' }
      },
      {
        path: 'message/listen',
        name: 'MessageListen',
        component: () => import('@/views/message/Listen.vue'),
        meta: { title: '消息监听', icon: 'ChatDotRound' }
      },
      {
        path: 'message/noreply',
        name: 'MessageNoreply',
        component: () => import('@/views/message/Noreply.vue'),
        meta: { title: '不回复列表', icon: 'Mute' }
      },
      {
        path: 'message/private',
        name: 'MessagePrivate',
        component: () => import('@/views/message/Private.vue'),
        meta: { title: '私聊管理', icon: 'Lock' }
      },
      {
        path: 'storage',
        name: 'Storage',
        component: () => import('@/views/storage/Index.vue'),
        meta: { title: '存储管理', icon: 'Coin' }
      },
      {
        path: 'task',
        name: 'Task',
        component: () => import('@/views/task/Index.vue'),
        meta: { title: '任务管理', icon: 'Timer' }
      },
      {
        path: 'reply',
        name: 'Reply',
        component: () => import('@/views/reply/Index.vue'),
        meta: { title: '自动回复', icon: 'ChatLineRound' }
      },
      {
        path: 'master',
        name: 'Master',
        component: () => import('@/views/master/Index.vue'),
        meta: { title: '管理员', icon: 'UserFilled' }
      },
      {
        path: 'proxy',
        name: 'Proxy',
        component: () => import('@/views/proxy/Index.vue'),
        meta: { title: '代理设置', icon: 'Connection' }
      },
      {
        path: 'script',
        name: 'Script',
        component: () => import('@/views/script/Index.vue'),
        meta: { title: '脚本编辑', icon: 'Edit' }
      },
      {
        path: 'secret/fenyong',
        name: 'SecretFenyong',
        component: () => import('@/views/secret/Fenyong.vue'),
        meta: { title: '分佣设置', icon: 'Money' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/404.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (!to.meta.public && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
