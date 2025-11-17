import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/single',
      name: 'singleplayer',
      component: () => import('@/pages/SinglePlayerGame.vue'),
    },
  ],
})

export default router
