<template>
  <div class="page watch-page">
    <p class="eyebrow">NIGHT WATCH</p>
    <h1>夜间值守模式</h1>
    <section class="watch-hero panel">
      <div>
        <span>{{ data.shift.name }}</span>
        <strong>{{ clock }}</strong>
        <p>{{ data.shift.window }} · {{ data.shift.keeper }} · {{ data.shift.mode }}</p>
      </div>
      <button type="button" @click="toggleFocus">{{ focusMode ? '退出专注' : '进入专注' }}</button>
    </section>
    <section v-if="loading" class="panel state">正在进入低噪声值守环境...</section>
    <section v-else-if="error" class="panel state error-box">{{ error }}</section>
    <template v-else>
      <section class="watch-grid" :class="{ focus: focusMode }">
        <article class="watch-card risk"><span>平均风险</span><strong>{{ data.pulse.riskAverage }}</strong><em>Greyfield Risk</em></article>
        <article class="watch-card critical"><span>待确认事件</span><strong>{{ data.pulse.criticalEvents }}</strong><em>Pending</em></article>
        <article class="watch-card"><span>处理中</span><strong>{{ data.pulse.processingEvents }}</strong><em>Processing</em></article>
        <article class="watch-card"><span>在线节点</span><strong>{{ data.pulse.onlineNodes }}</strong><em>Nodes</em></article>
      </section>
      <section class="watch-layout">
        <article class="panel"><h2>值守聚光区</h2><div class="spotlight-list"><div v-for="item in data.spotlight" :key="item.id" class="spotlight-item"><b>{{ item.title }}</b><span>{{ item.score }} 分 · {{ item.status }}</span><p>{{ item.suggestion }}</p></div></div></article>
        <article class="panel"><h2>低噪声检查单</h2><label v-for="item in data.checklist" :key="item.label" class="watch-check"><input type="checkbox" v-model="item.done" /><span>{{ item.label }}</span></label></article>
      </section>
    </template>
  </div>
</template>
<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { api } from '../api';
const loading=ref(false); const error=ref(''); const focusMode=ref(false); const clock=ref(''); let timer;
const data=reactive({shift:{},pulse:{},spotlight:[],checklist:[]});
function tick(){clock.value=new Date().toLocaleTimeString('zh-CN',{hour12:false});}
function toggleFocus(){focusMode.value=!focusMode.value; document.body.classList.toggle('watch-focus', focusMode.value);}
onMounted(async()=>{tick();timer=setInterval(tick,1000);loading.value=true;try{const payload=await api('/watch/night');Object.assign(data,payload.data||payload);}catch(e){error.value=`加载失败：${e.message}`;}finally{loading.value=false;}});
onUnmounted(()=>{clearInterval(timer);document.body.classList.remove('watch-focus');});
</script>
