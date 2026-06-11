<template>
  <div class="page">
    <p class="eyebrow">GREYFIELD RISK</p>
    <h1>灰域风险评分</h1>
    <section class="panel">
      <div v-if="loading" class="state">正在计算灰域风险分...</div>
      <div v-else-if="error" class="state error-box">{{ error }}</div>
      <template v-else>
        <div class="risk-hero">
          <div class="risk-orb" :class="overviewBand">
            <span>平均风险</span><strong>{{ data.overview.average }}</strong>
          </div>
          <div class="risk-explain">
            <h2>评分模型</h2>
            <p>{{ data.formula }}</p>
            <small>更新时间：{{ formatTime(data.updatedAt) }}</small>
          </div>
        </div>
        <div class="risk-metrics">
          <article>
            <span>对象总数</span><strong>{{ data.overview.total }}</strong>
          </article>
          <article class="critical">
            <span>高危</span><strong>{{ data.overview.critical }}</strong>
          </article>
          <article class="high">
            <span>偏高</span><strong>{{ data.overview.high }}</strong>
          </article>
          <article>
            <span>中低风险</span><strong>{{ data.overview.medium + data.overview.low }}</strong>
          </article>
        </div>
        <div class="risk-list">
          <article v-for="item in data.items" :key="item.id" class="risk-item">
            <div class="risk-score" :class="item.band">{{ item.score }}</div>
            <div class="risk-body">
              <div class="risk-title">
                <strong>{{ item.target }}</strong
                ><span>{{ typeName(item.type) }} · {{ bandName(item.band) }}</span>
              </div>
              <div class="risk-reasons">
                <em v-for="reason in item.reasons" :key="reason">{{ reason }}</em>
              </div>
            </div>
          </article>
        </div>
      </template>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api';
const loading = ref(false);
const error = ref('');
const data = reactive({
  overview: { total: 0, average: 0, critical: 0, high: 0, medium: 0, low: 0 },
  formula: '',
  updatedAt: '',
  items: []
});
const overviewBand = computed(() =>
  data.overview.average >= 75
    ? 'critical'
    : data.overview.average >= 55
      ? 'high'
      : data.overview.average >= 35
        ? 'medium'
        : 'low'
);
const typeMap = { role: '角色', user: '用户', audit: '审计主体', job: '任务', node: '节点' };
const bandMap = { critical: '高危', high: '偏高', medium: '中等', low: '低风险' };
function typeName(type) {
  return typeMap[type] || type;
}
function bandName(band) {
  return bandMap[band] || band;
}
function formatTime(value) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}
onMounted(async () => {
  loading.value = true;
  try {
    const payload = await api('/risk/scores');
    Object.assign(data, payload.data || payload);
  } catch (e) {
    error.value = `加载失败：${e.message}`;
  } finally {
    loading.value = false;
  }
});
</script>
