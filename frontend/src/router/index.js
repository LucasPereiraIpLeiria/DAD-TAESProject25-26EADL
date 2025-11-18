import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/home/HomePage.vue'
import SingleplayerGamePage from '@/pages/game/SingleplayerGamePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/game',
      children: [
        {
          path: 'singleplayer',
          name: 'singleplayer',
          component: SingleplayerGamePage,
        },
      ],
    },
  ],
})

export default router
