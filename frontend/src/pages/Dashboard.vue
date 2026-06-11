<template>
  <div class="page">
    <p class="eyebrow">DASHBOARD</p>
    <h1>星图总览</h1>
    <div class="grid cards">
      <article v-for="card in data.cards" :key="card.label" class="card">
        <span>{{ card.label }}</span
        ><strong>{{ card.value }}</strong
        ><em>{{ card.delta }}</em>
      </article>
    </div>
    <section class="panel">
      <h2>风险趋势</h2>
      <div class="bars">
        <i
          v-for="(n, index) in data.trend"
          :key="`trend-${index}`"
          :style="{ height: n * 2 + 'px' }"
        ></i>
      </div>
    </section>
    <section class="panel">
      <h2>最近审计</h2>
      <pre>{{ data.feed }}</pre>
    </section>
  </div>
</template>
<script setup>
import { reactive, onMounted } from 'vue';
import { api } from '../api';
const data = reactive({ cards: [], trend: [], feed: [] });
onMounted(async () => Object.assign(data, await api('/dashboard')));
</script>
