<template>
  <div class="page">
    <p class="eyebrow">RISK EVENTS</p>
    <h1>风险事件中心</h1>
    <section class="panel">
      <div v-if="loading" class="state">正在聚合风险事件...</div>
      <div v-else-if="error" class="state error-box">{{ error }}</div>
      <template v-else>
        <div class="event-metrics">
          <article><span>事件总数</span><strong>{{ overview.total }}</strong></article>
          <article class="danger"><span>待确认</span><strong>{{ overview.pending }}</strong></article>
          <article class="warn"><span>处理中</span><strong>{{ overview.processing }}</strong></article>
          <article><span>已确认/归档</span><strong>{{ overview.confirmed + overview.archived }}</strong></article>
        </div>
        <div class="event-board">
          <article v-for="event in events" :key="event.id" class="event-card" :class="event.level">
            <header><span>{{ event.id }}</span><b>{{ levelName(event.level) }}</b></header>
            <h2>{{ event.title }}</h2>
            <p>{{ event.suggestion }}</p>
            <div class="event-reasons"><em v-for="reason in event.reasons" :key="reason">{{ reason }}</em></div>
            <footer>
              <select v-model="event.status">
                <option value="pending">待确认</option><option value="processing">处理中</option><option value="confirmed">已确认</option><option value="ignored">已忽略</option><option value="archived">已归档</option>
              </select>
              <time>{{ formatTime(event.createdAt) }}</time>
            </footer>
          </article>
        </div>
      </template>
    </section>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
const loading=ref(false); const error=ref(''); const overview=ref({total:0,pending:0,processing:0,confirmed:0,archived:0}); const events=ref([]);
const levelMap={critical:'高危',high:'偏高',medium:'中等',low:'低风险'};
function levelName(level){return levelMap[level]||level}
function formatTime(value){return value?new Date(value).toLocaleString('zh-CN'):'-'}
onMounted(async()=>{loading.value=true;try{const payload=await api('/risk/events');const data=payload.data||payload;overview.value=data.overview;events.value=data.events;}catch(e){error.value=`加载失败：${e.message}`;}finally{loading.value=false;}})
</script>
