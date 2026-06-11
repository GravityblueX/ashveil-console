import { createApp, defineAsyncComponent } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './styles/tokens.css';
import './styles.css';

const page = (loader) =>
  defineAsyncComponent({
    loader,
    delay: 80,
    timeout: 10000,
    errorComponent: { template: '<div class="state error-box">页面加载失败，请刷新重试。</div>' },
    loadingComponent: { template: '<div class="state">正在加载灰域模块...</div>' }
  });

const Login = page(() => import('./pages/Login.vue'));
const Dashboard = page(() => import('./pages/Dashboard.vue'));
const TablePage = page(() => import('./pages/TablePage.vue'));
const PermissionMatrix = page(() => import('./pages/PermissionMatrix.vue'));
const AuditCenter = page(() => import('./pages/AuditCenter.vue'));
const RiskScores = page(() => import('./pages/RiskScores.vue'));
const RiskEvents = page(() => import('./pages/RiskEvents.vue'));
const NightWatch = page(() => import('./pages/NightWatch.vue'));
const IdeasRoadmap = page(() => import('./pages/IdeasRoadmap.vue'));

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/risk/scores', component: RiskScores },
  { path: '/risk/events', component: RiskEvents },
  { path: '/watch/night', component: NightWatch },
  { path: '/ideas', component: IdeasRoadmap },
  {
    path: '/access/users',
    component: TablePage,
    props: { title: '身份权限', endpoint: '/access/users' }
  },
  { path: '/access/matrix', component: PermissionMatrix },
  {
    path: '/system/dictionaries',
    component: TablePage,
    props: { title: '数据字典', endpoint: '/dictionaries' }
  },
  { path: '/audit/logs', component: AuditCenter },
  { path: '/jobs', component: TablePage, props: { title: '任务编排', endpoint: '/jobs' } },
  { path: '/monitor', component: TablePage, props: { title: '系统脉搏', endpoint: '/monitor' } }
];

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to) => {
  if (to.path !== '/login' && !localStorage.getItem('token')) return '/login';
});

createApp(App).use(createPinia()).use(router).mount('#app');
