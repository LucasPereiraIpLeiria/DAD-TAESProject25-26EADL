import { createRouter, createWebHistory } from 'vue-router'

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
      component: ()=> import('@/pages/login/LoginPage.vue')
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
    },
  ],
})

export default router
