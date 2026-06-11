<template>
  <div class="page">
    <p class="eyebrow">AUDIT CENTER</p>
    <h1>审计轨迹</h1>
    <section class="audit-layout">
      <article class="panel audit-summary">
        <div v-if="loading" class="state">正在加载审计摘要...</div>
        <template v-else>
          <div class="audit-metrics">
            <div class="metric">
              <span>总日志</span><strong>{{ summary.total }}</strong>
            </div>
            <div class="metric danger">
              <span>高危</span><strong>{{ summary.critical }}</strong>
            </div>
            <div class="metric warn">
              <span>警告</span><strong>{{ summary.warning }}</strong>
            </div>
            <div class="metric">
              <span>信息</span><strong>{{ summary.info }}</strong>
            </div>
          </div>
          <h2>渠道分布</h2>
          <div class="channel-bars">
            <div
              v-for="(count, channel) in summary.channelCount"
              :key="channel"
              class="channel-row"
            >
              <span>{{ channel }}</span>
              <i :style="{ width: `${Math.max(12, (count / summary.total) * 100)}%` }"></i>
              <b>{{ count }}</b>
            </div>
          </div>
        </template>
      </article>
      <article class="panel audit-timeline-panel">
        <h2>风险时间线</h2>
        <div v-if="loading" class="state">正在加载时间线...</div>
        <ol v-else class="audit-timeline">
          <li v-for="item in summary.latest" :key="item.id" :class="item.level">
            <time>{{ item.time }}</time>
            <strong>{{ item.action }}</strong>
            <span>{{ item.actor }} · {{ item.channel }}</span>
          </li>
        </ol>
      </article>
    </section>
    <TablePage title="审计明细" endpoint="/audit/logs" />
  </div>
</template>
<script setup>
import { onMounted, reactive, ref } from 'vue';
import { api } from '../api';
import TablePage from './TablePage.vue';
const loading = ref(false);
const summary = reactive({
  total: 0,
  critical: 0,
  warning: 0,
  info: 0,
  channelCount: {},
  latest: []
});
onMounted(async () => {
  loading.value = true;
  try {
    Object.assign(summary, await api('/audit/summary'));
  } finally {
    loading.value = false;
  }
});
</script>
