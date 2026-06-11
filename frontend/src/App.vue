<template>
  <router-view v-if="$route.path === '/login'" />
  <div v-else class="shell">
    <aside class="side">
      <div class="brand">
        <span class="moon">◑</span>
        <div><b>Ashveil</b><small>Greyfield Console</small></div>
      </div>
      <router-link v-for="item in menus" :key="item.path" :to="item.path" class="nav">
        <span>{{ item.icon }}</span
        >{{ item.title }}
      </router-link>
    </aside>
    <main class="main">
      <header class="top"><span>灰域观察台</span><button @click="logout">退出</button></header>
      <router-view />
    </main>
  </div>
</template>
<script setup>
const menus = JSON.parse(localStorage.getItem('menus') || '[]');
function logout() {
  localStorage.clear();
  location.href = '/login';
}
</script>
