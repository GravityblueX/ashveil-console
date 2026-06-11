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
