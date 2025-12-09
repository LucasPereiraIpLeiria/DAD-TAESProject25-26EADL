import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAPIStore } from '@/stores/api'
import { MotionPlugin } from '@vueuse/motion'

import App from './App.vue'
import router from './router'

import 'vue-sonner/style.css'

const API_BASE_URL = 'http://localhost:8000/api'


const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)
app.provide('apiBaseURL', API_BASE_URL)


const store = useAPIStore()

await store.validateToken()

app.mount('#app')
