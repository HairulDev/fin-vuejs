import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import { Form, Field, ErrorMessage, configure } from 'vee-validate'

// Konfigurasi VeeValidate
configure({
    validateOnInput: true,
    validateOnChange: true,
})

const app = createApp(App)

// Register komponen Vee-Validate
app.component('VeeForm', Form)
app.component('VeeField', Field)
app.component('ErrorMessage', ErrorMessage)

app.use(router)
app.use(createPinia())
app.mount('#app')