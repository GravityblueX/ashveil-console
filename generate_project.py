from pathlib import Path
import json, textwrap
root = Path(r'C:\Users\123\Desktop\fountain\nocturne-admin')

def w(path, content):
    p = root / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(textwrap.dedent(content).lstrip(), encoding='utf-8')

w('README.md', r'''
# Nocturne Admin

一个参考 **eladmin** 的业务边界重新设计的前后端分离后台管理系统示例。项目没有复制原项目源码：技术栈、目录结构、视觉风格、模块命名与交互布局均重新设计。

## 差异化定位

- **视觉风格**：暗色玻璃拟态 + 黑白灰低饱和配色，区别于传统 Element 后台模板。
- **前端技术栈**：Vue 3 + Vite + Pinia + Vue Router，自研暗色组件与仪表盘布局。
- **后端技术栈**：Node.js + Express + JWT，轻量化模块结构，内置模拟 RBAC、菜单、字典、审计日志、任务中心。
- **产品侧重点**：从“通用后台脚手架”改成“运营中台 / 风控观测台 / 权限审计台”的体验。

## 功能模块

- 登录鉴权：JWT 登录、用户信息、菜单权限
- 总览看板：指标卡片、风险趋势、活动流
- 权限中心：用户、角色、菜单、部门
- 数据字典：状态、渠道、风险级别维护
- 审计日志：登录日志、操作日志、异常记录
- 任务中心：定时任务定义与执行记录
- 系统监控：服务指标与节点状态 mock

## 快速启动

```bash
# 后端
cd backend
npm install
npm run dev

# 前端
cd frontend
npm install
npm run dev
```

默认账号：`admin / nocturne2026`

## 项目结构

```text
nocturne-admin
├─ backend       # Express API 服务
├─ frontend      # Vue 3 管理端
└─ docs          # 设计与接口说明
```

## License

MIT
''')

w('docs/architecture.md', r'''
# Nocturne Admin 架构说明

## 参考边界

eladmin 提供了用户、角色、菜单、字典、日志、任务、监控、代码生成等后台管理能力。Nocturne Admin 保留“后台管理系统”的通用业务边界，但重新实现为轻量 Node + Vue 3 项目，并采用完全不同的暗色产品视觉。

## 后端模块

- `auth`：登录、JWT、当前用户
- `access`：用户、角色、菜单、部门
- `dictionary`：字典类型与字典项
- `audit`：操作日志、异常日志
- `scheduler`：任务定义、任务历史
- `monitor`：服务健康、节点指标

## 前端页面

- `/login`：暗色登录页
- `/dashboard`：运营总览
- `/access/users`：用户管理
- `/access/roles`：角色管理
- `/system/dictionaries`：字典管理
- `/audit/logs`：审计日志
- `/jobs`：任务中心
- `/monitor`：系统监控
''')

w('backend/package.json', r'''
{
  "name": "nocturne-admin-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0"
  },
  "devDependencies": {}
}
''')

w('backend/src/server.js', r'''
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { users, roles, menus, dictionaries, auditLogs, jobs, monitor } from './store.js';

const app = express();
const PORT = process.env.PORT || 4160;
const JWT_SECRET = process.env.JWT_SECRET || 'nocturne-local-secret';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

function sign(user) {
  return jwt.sign({ id: user.id, username: user.username, roles: user.roles }, JWT_SECRET, { expiresIn: '8h' });
}

function auth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', (_, res) => res.json({ ok: true, name: 'Nocturne Admin API' }));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(item => item.username === username && item.password === password);
  if (!user) return res.status(401).json({ message: '账号或密码错误' });
  const { password: _, ...safeUser } = user;
  res.json({ token: sign(user), user: safeUser, menus });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find(item => item.id === req.user.id);
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, menus });
});

app.get('/api/dashboard', auth, (_, res) => {
  res.json({
    cards: [
      { label: '活跃用户', value: 1286, delta: '+12.4%' },
      { label: '权限变更', value: 42, delta: '-3.1%' },
      { label: '风险事件', value: 17, delta: '+5' },
      { label: '任务成功率', value: '99.2%', delta: '+0.8%' }
    ],
    trend: [12, 18, 9, 26, 31, 22, 36, 29, 41, 33, 46, 52],
    feed: auditLogs.slice(0, 5)
  });
});

app.get('/api/access/users', auth, (_, res) => res.json(users.map(({ password, ...u }) => u)));
app.get('/api/access/roles', auth, (_, res) => res.json(roles));
app.get('/api/access/menus', auth, (_, res) => res.json(menus));
app.get('/api/dictionaries', auth, (_, res) => res.json(dictionaries));
app.get('/api/audit/logs', auth, (_, res) => res.json(auditLogs));
app.get('/api/jobs', auth, (_, res) => res.json(jobs));
app.get('/api/monitor', auth, (_, res) => res.json(monitor));

app.use((_, res) => res.status(404).json({ message: 'Not Found' }));

app.listen(PORT, () => console.log(`Nocturne Admin API listening on http://localhost:${PORT}`));
''')

w('backend/src/store.js', r'''
export const roles = [
  { id: 1, code: 'ROOT', name: '超级管理员', scope: 'ALL', users: 1 },
  { id: 2, code: 'AUDITOR', name: '审计员', scope: 'DEPT', users: 3 },
  { id: 3, code: 'OPS', name: '运维观察员', scope: 'SELF', users: 5 }
];

export const users = [
  { id: 1, username: 'admin', password: 'nocturne2026', nickname: 'Night Operator', dept: '中台治理部', roles: ['ROOT'], status: 'active', lastLogin: '2026-06-11 08:00' },
  { id: 2, username: 'mira', password: 'demo123456', nickname: 'Mira', dept: '风控组', roles: ['AUDITOR'], status: 'active', lastLogin: '2026-06-10 19:42' },
  { id: 3, username: 'ops01', password: 'demo123456', nickname: 'Ops Watcher', dept: '基础设施组', roles: ['OPS'], status: 'locked', lastLogin: '2026-06-09 13:18' }
];

export const menus = [
  { path: '/dashboard', title: '星图总览', icon: '◐' },
  { path: '/access/users', title: '身份权限', icon: '◇' },
  { path: '/system/dictionaries', title: '数据字典', icon: '□' },
  { path: '/audit/logs', title: '审计轨迹', icon: '◎' },
  { path: '/jobs', title: '任务编排', icon: '△' },
  { path: '/monitor', title: '系统脉搏', icon: '▣' }
];

export const dictionaries = [
  { type: 'risk_level', name: '风险等级', items: ['low', 'medium', 'high', 'critical'] },
  { type: 'account_status', name: '账号状态', items: ['active', 'locked', 'disabled'] },
  { type: 'channel', name: '来源渠道', items: ['console', 'api', 'scheduler', 'webhook'] }
];

export const auditLogs = [
  { id: 1001, actor: 'admin', action: '刷新角色权限矩阵', channel: 'console', level: 'info', time: '2026-06-11 08:16:22' },
  { id: 1002, actor: 'mira', action: '导出异常登录报告', channel: 'console', level: 'warning', time: '2026-06-11 07:54:08' },
  { id: 1003, actor: 'system', action: '自动归档任务日志', channel: 'scheduler', level: 'info', time: '2026-06-11 02:10:00' },
  { id: 1004, actor: 'ops01', action: '访问受限菜单被拒绝', channel: 'console', level: 'critical', time: '2026-06-10 21:33:19' }
];

export const jobs = [
  { id: 1, name: '权限快照生成', cron: '0 */2 * * *', status: 'running', successRate: '99.8%' },
  { id: 2, name: '异常登录扫描', cron: '*/15 * * * *', status: 'running', successRate: '98.1%' },
  { id: 3, name: '审计日志冷归档', cron: '0 3 * * *', status: 'paused', successRate: '100%' }
];

export const monitor = {
  api: { uptime: '18d 04h', cpu: 36, memory: 62, qps: 218 },
  nodes: [
    { name: 'gateway-01', status: 'healthy', latency: '18ms' },
    { name: 'worker-02', status: 'healthy', latency: '24ms' },
    { name: 'audit-archive', status: 'degraded', latency: '91ms' }
  ]
};
''')

w('frontend/package.json', r'''
{
  "name": "nocturne-admin-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@vitejs/plugin-vue": "^5.0.5",
    "vite": "^5.3.1",
    "vue": "^3.4.29",
    "vue-router": "^4.3.3",
    "pinia": "^2.1.7"
  },
  "devDependencies": {}
}
''')

w('frontend/index.html', r'''
<div id="app"></div><script type="module" src="/src/main.js"></script>
''')

w('frontend/src/main.js', r'''
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Login from './pages/Login.vue';
import Dashboard from './pages/Dashboard.vue';
import TablePage from './pages/TablePage.vue';
import './styles.css';

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login },
  { path: '/dashboard', component: Dashboard },
  { path: '/access/users', component: TablePage, props: { title: '身份权限', endpoint: '/access/users' } },
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
''')

w('frontend/src/api.js', r'''
const base = import.meta.env.VITE_API_BASE || 'http://localhost:4160/api';
export async function api(path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '', ...(options.headers || {}) }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Request failed');
  return res.json();
}
''')

w('frontend/src/App.vue', r'''
<template>
  <router-view v-if="$route.path === '/login'" />
  <div v-else class="shell">
    <aside class="side">
      <div class="brand"><span class="moon">◑</span><div><b>Nocturne</b><small>Admin Console</small></div></div>
      <router-link v-for="item in menus" :key="item.path" :to="item.path" class="nav">
        <span>{{ item.icon }}</span>{{ item.title }}
      </router-link>
    </aside>
    <main class="main">
      <header class="top"><span>暗色运营中台</span><button @click="logout">退出</button></header>
      <router-view />
    </main>
  </div>
</template>
<script setup>
const menus = JSON.parse(localStorage.getItem('menus') || '[]');
function logout(){ localStorage.clear(); location.href='/login'; }
</script>
''')

w('frontend/src/pages/Login.vue', r'''
<template>
  <section class="login">
    <div class="login-card">
      <p class="eyebrow">NOCTURNE ACCESS</p>
      <h1>进入夜航控制台</h1>
      <p class="muted">低饱和暗色后台系统，内置 RBAC、审计、任务与监控模块。</p>
      <input v-model="username" placeholder="用户名 admin" />
      <input v-model="password" placeholder="密码 nocturne2026" type="password" />
      <button @click="submit">登录</button>
      <p class="error" v-if="error">{{ error }}</p>
    </div>
  </section>
</template>
<script setup>
import { ref } from 'vue';
import { api } from '../api';
const username = ref('admin');
const password = ref('nocturne2026');
const error = ref('');
async function submit(){
  try {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ username: username.value, password: password.value }) });
    localStorage.setItem('token', data.token);
    localStorage.setItem('menus', JSON.stringify(data.menus));
    location.href = '/dashboard';
  } catch(e) { error.value = e.message; }
}
</script>
''')

w('frontend/src/pages/Dashboard.vue', r'''
<template>
  <div class="page">
    <p class="eyebrow">DASHBOARD</p><h1>星图总览</h1>
    <div class="grid cards">
      <article v-for="card in data.cards" :key="card.label" class="card">
        <span>{{ card.label }}</span><strong>{{ card.value }}</strong><em>{{ card.delta }}</em>
      </article>
    </div>
    <section class="panel">
      <h2>风险趋势</h2>
      <div class="bars"><i v-for="n in data.trend" :style="{height: n*2+'px'}"></i></div>
    </section>
    <section class="panel"><h2>最近审计</h2><pre>{{ data.feed }}</pre></section>
  </div>
</template>
<script setup>
import { reactive, onMounted } from 'vue';
import { api } from '../api';
const data = reactive({ cards: [], trend: [], feed: [] });
onMounted(async()=> Object.assign(data, await api('/dashboard')));
</script>
''')

w('frontend/src/pages/TablePage.vue', r'''
<template>
  <div class="page">
    <p class="eyebrow">MODULE</p><h1>{{ title }}</h1>
    <section class="panel"><pre>{{ rows }}</pre></section>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';
const props = defineProps({ title: String, endpoint: String });
const rows = ref([]);
onMounted(async()=> rows.value = await api(props.endpoint));
</script>
''')

w('frontend/src/styles.css', r'''
:root{font-family:Inter,ui-sans-serif,system-ui;color:#e7e7e7;background:#09090b}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 20% 0%,#2b2b31 0,#09090b 38%,#050506 100%)}a{color:inherit;text-decoration:none}.shell{display:flex;min-height:100vh}.side{width:260px;padding:26px;border-right:1px solid #27272a;background:rgba(12,12,14,.72);backdrop-filter:blur(22px)}.brand{display:flex;gap:14px;align-items:center;margin-bottom:34px}.brand b{display:block;font-size:22px}.brand small{display:block;color:#888}.moon{width:42px;height:42px;border:1px solid #555;border-radius:16px;display:grid;place-items:center;background:#171717}.nav{display:flex;gap:12px;padding:13px 14px;margin:8px 0;border-radius:14px;color:#b9b9b9}.nav.router-link-active,.nav:hover{background:#f4f4f5;color:#111}.main{flex:1}.top{height:70px;border-bottom:1px solid #27272a;display:flex;justify-content:space-between;align-items:center;padding:0 30px;background:rgba(10,10,12,.5)}button{border:0;border-radius:12px;background:#f4f4f5;color:#09090b;padding:11px 18px;font-weight:700;cursor:pointer}.page{padding:32px}.eyebrow{letter-spacing:.22em;color:#a1a1aa;font-size:12px}h1{font-size:42px;margin:6px 0 24px}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.card,.panel,.login-card{border:1px solid #2d2d33;background:linear-gradient(145deg,rgba(39,39,42,.86),rgba(12,12,14,.86));border-radius:24px;box-shadow:0 20px 80px rgba(0,0,0,.35)}.card{padding:22px}.card span{color:#aaa}.card strong{display:block;font-size:34px;margin:14px 0}.card em{color:#d4d4d8}.panel{padding:24px;margin-top:20px}pre{white-space:pre-wrap;color:#cfcfcf}.bars{height:130px;display:flex;align-items:end;gap:12px}.bars i{width:100%;border-radius:10px 10px 0 0;background:linear-gradient(#f4f4f5,#555)}.login{min-height:100vh;display:grid;place-items:center;padding:20px}.login-card{width:min(460px,92vw);padding:38px}.muted{color:#aaa;line-height:1.7}input{width:100%;margin:10px 0;padding:14px 16px;border-radius:14px;border:1px solid #3f3f46;background:#111;color:#eee}.error{color:#fca5a5}@media(max-width:900px){.grid{grid-template-columns:1fr}.side{width:210px}}
''')

w('.gitignore', r'''
node_modules
dist
.env
.DS_Store
.vscode
.idea
*.log
''')

w('LICENSE', r'''
MIT License

Copyright (c) 2026 GravityblueX

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
''')
print('generated', root)
