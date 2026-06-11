import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Login from './pages/Login.vue';
import Dashboard from './pages/Dashboard.vue';
import TablePage from './pages/TablePage.vue';
import PermissionMatrix from './pages/PermissionMatrix.vue';
import './styles.css';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/access/users', component: TablePage, props: { title: '身份权限', endpoint: '/access/users' } },
  { path: '/access/matrix', component: PermissionMatrix },
  { path: '/system/dictionaries', component: TablePage, props: { title: '数据字典', endpoint: '/dictionaries' } },
  { path: '/audit/logs', component: TablePage, props: { title: '审计轨迹', endpoint: '/audit/logs' } },
  { path: '/jobs', component: TablePage, props: { title: '任务编排', endpoint: '/jobs' } },
  { path: '/monitor', component: TablePage, props: { title: '系统脉搏', endpoint: '/monitor' } }
];

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to) => {
  if (to.path !== '/login' && !localStorage.getItem('token')) return '/login';
});

createApp(App).use(createPinia()).use(router).mount('#app');
