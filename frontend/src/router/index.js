import { createRouter, createWebHistory } from 'vue-router'
import HistoryView from '@/pages/user/HistoryView.vue'
import RegisterPage from '@/pages/login/RegisterPage.vue'
import { useAuthStore } from '@/stores/auth.js'
import { toast } from 'vue-sonner'
import UserProfile from '@/pages/user/UserProfile.vue'
import EditProfile from '@/pages/user/EditProfile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/home/HomePage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/LoginPage.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterPage,
    },
    {
      // página de setup singleplayer
      path: '/singleplayer',
      name: 'singleplayer.mode.select',
      component: () => import('@/pages/SinglePlayerModeSelect.vue'),
    },
    {
      // página do jogo em si
      // gametype = 'practice' | 'match'
      path: '/singleplayer/:gametype/:variant',
      name: 'singleplayer.game',
      component: () => import('@/pages/SinglePlayerGame.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: UserProfile,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/edit',
      name: 'editProfile',
      component: EditProfile,
      meta: { requiresAuth: true },
    },
    {
      path: '/customizations',
      name: 'customizations',
      component: () => import('@/pages/CustomizationsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Bloquear login/register se já estiver logado
  if (
    (to.name === 'login' || to.name === 'register') &&
    authStore.isLoggedIn
  ) {
    return next({ name: 'home' })
  }

  // Rotas que exigem autenticação
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    toast.error('This navigation requires authentication')
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Regras específicas para singleplayer.game
  if (to.name === 'singleplayer.game') {
    const gametype = to.params.gametype

    // matches precisam de autenticação
    if (gametype === 'match' && !authStore.isLoggedIn) {
      toast.error('This navigation requires authentication')
      return next({ name: 'login', query: { redirect: to.fullPath } })
    }
  }

  next()
})

export default router
