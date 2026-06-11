<template>
  <div class="page">
    <p class="eyebrow">IDEAS ROADMAP</p>
    <h1>功能建议中心</h1>
    <section class="panel">
      <div v-if="loading" class="state">正在生成下一阶段路线图...</div>
      <div v-else-if="error" class="state error-box">{{ error }}</div>
      <template v-else>
        <div class="idea-summary">
          <article>
            <span>建议总数</span><strong>{{ roadmap.overview.total }}</strong>
          </article>
          <article>
            <span>P0 优先级</span><strong>{{ roadmap.overview.p0 }}</strong>
          </article>
          <article>
            <span>平均影响</span><strong>{{ roadmap.overview.averageImpact }}</strong>
          </article>
          <article>
            <span>下一候选</span><strong>{{ roadmap.overview.nextCandidate }}</strong>
          </article>
        </div>
        <div class="roadmap-board">
          <section v-for="stage in roadmap.stages" :key="stage.key" class="roadmap-column">
            <header>
              <h2>{{ stage.name }}</h2>
              <p>{{ stage.description }}</p>
            </header>
            <article v-for="item in stage.items" :key="item.id" class="idea-card">
              <div class="idea-head">
                <b>{{ item.title }}</b>
                <span>{{ item.priority }}</span>
              </div>
              <p>{{ item.summary }}</p>
              <em>{{ item.reason }}</em>
              <footer>
                <span>{{ item.category }}</span>
                <span>影响 {{ item.impact }} / 工作量 {{ item.effort }}</span>
              </footer>
            </article>
          </section>
        </div>
      </template>
    </section>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';
const loading = ref(false);
const error = ref('');
const roadmap = ref({ overview: {}, stages: [] });
onMounted(async () => {
  loading.value = true;
  try {
    const data = await api('/ideas');
    roadmap.value = data.roadmap;
  } catch (e) {
    error.value = `加载失败：${e.message}`;
  } finally {
    loading.value = false;
  }
});
</script>
