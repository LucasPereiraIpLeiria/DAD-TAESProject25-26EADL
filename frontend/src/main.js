import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const API_BASE_URL = 'http://localhost:8000/api'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.provide('apiBaseURL', API_BASE_URL)

app.mount('#app')
