import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/single',
      name: 'singleplayer-select',
      component: () => import('@/pages/SinglePlayerModeSelect.vue'), // nova página para escolher modo
    },
    {
      path: '/single/:mode',
      name: 'singleplayer',
      component: () => import('@/pages/SinglePlayerGame.vue'), // jogo real
      props: true, // permite passar o `mode` como prop
    },
  ],
})

export default router
