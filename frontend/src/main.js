import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAPIStore } from '@/stores/api'
import { MotionPlugin } from '@vueuse/motion'

import App from './App.vue'
import router from './router'

import 'vue-sonner/style.css'

const API_BASE_URL = 'http://localhost:8000/api'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(MotionPlugin)
app.provide('apiBaseURL', API_BASE_URL)

// Garante que o inject('apiBaseURL') funciona dentro do store
await app.runWithContext(async () => {
  const store = useAPIStore()
  await store.validateToken()
})

app.mount('#app')
