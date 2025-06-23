import { createRouter, createWebHistory } from 'vue-router';
import StationListView from '../views/StationListView.vue';
import CascadeView from '../views/CascadeView.vue';
import StationDetailView from '../views/StationDetailView.vue';
import LoginView from '../views/LoginView.vue';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/', redirect: '/stations' },
  { path: '/stations', component: StationListView },
  { path: '/cascade', component: CascadeView },
  { path: '/station/:id', component: StationDetailView },
  {
    path: '/visualization',
    name: 'StationMapView',
    component: () => import('../views/StationMapView.vue')
  },
  {
    path: '/add-record',
    name: 'AddRecordView',
    component: () => import('../views/AddRecordView.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 路由守卫：未登录跳转到 /login
router.beforeEach((to, from, next) => {
  const publicPages = ['/login'];
  const token = localStorage.getItem('token');
  const exp = localStorage.getItem('token_exp');
  const isExpired = exp && Date.now() > Number(exp);
  if (!publicPages.includes(to.path) && (!token || isExpired)) {
    localStorage.removeItem('token');
    localStorage.removeItem('token_exp');
    return next('/login');
  }
  if (to.path === '/login' && token && !isExpired) {
    return next('/');
  }
  next();
});

export default router; 