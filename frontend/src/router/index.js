import HistoryView from '@/pages/user/HistoryView.vue'
import { createRouter, createWebHistory } from 'vue-router'
import RegisterPage from '@/pages/login/RegisterPage.vue'
import {useAuthStore} from '@/stores/auth.js'
import {toast} from 'vue-sonner'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ()=> import('@/pages/home/HomePage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: ()=> import('@/pages/login/LoginPage.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/profile/ProfilePage.vue')
    },
    {// página de setup singleplayer (escolhas todas + Start Game)
      path: '/singleplayer',
      name: 'singleplayer.mode.select',
      component: () => import('@/pages/SinglePlayerModeSelect.vue'),
    },
    {
      // página do jogo em si
      path: '/singleplayer/:mode/:gametype/:variant',
      name: 'singleplayer.game',
      component: () => import('@/pages/SinglePlayerGame.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history' ,
      name: 'history',
      component: HistoryView
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFoundPage.vue'),
    }
  ],
})

// Route Guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Check authentication
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    toast.error('This navigation requires authentication')
    next({ name: 'login' })
    return
  }

  // Shield singleplayer route based on parameter
  if (to.name === 'singleplayer.game') {
    const mode = to.params.mode
    if (mode === 'competitive' && !authStore.isLoggedIn) {
      toast.error('This mode is not available')
      next({ name: 'login' })
      return
    }
  }

  next()
});

export default router
