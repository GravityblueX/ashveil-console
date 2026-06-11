<template>
  <section class="login">
    <div class="login-card">
      <p class="eyebrow">ASHVEIL ACCESS</p>
      <h1>进入灰域观察台</h1>
      <p class="muted">看见权限、审计、任务与系统脉搏之间的灰域变化。</p>
      <input v-model="username" placeholder="用户名 admin" />
      <input v-model="password" placeholder="密码 ashveil2026" type="password" />
      <button @click="submit">登录</button>
      <p class="error" v-if="error">{{ error }}</p>
    </div>
  </section>
</template>
<script setup>
import { ref } from 'vue';
import { api } from '../api';
const username = ref('admin');
const password = ref('ashveil2026');
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
