import { createRouter, createWebHistory } from 'vue-router';

const routes = [
    { path: '/', redirect: '/login' },
    { path: '/register', name: 'Register', component: () => import('../views/RegisterView.vue') },
    { path: '/login', name: 'Login', component: () => import('../views/LoginView.vue') },
    { path: '/home', name: 'Home', component: () => import('../views/HomeView.vue') },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    const user = localStorage.getItem('user');
    if (!user && to.name !== 'Login' && to.name !== 'Register') {
        next({ name: 'Login' });
    } else {
        next();
    }
});

export default router;
