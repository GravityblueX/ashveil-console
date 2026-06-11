<template>
  <div class="page">
    <p class="eyebrow">MODULE</p><h1>{{ title }}</h1>
    <section class="panel">
      <div v-if="loading" class="state">正在加载 {{ title }} 数据...</div>
      <div v-else-if="error" class="state error-box">{{ error }}</div>
      <pre v-else>{{ prettyRows }}</pre>
    </section>
  </div>
</template>
<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { api } from '../api';
const props = defineProps({ title: String, endpoint: String });
const rows = ref(null);
const loading = ref(false);
const error = ref('');
const prettyRows = computed(() => JSON.stringify(rows.value, null, 2));
async function load(){
  loading.value = true;
  error.value = '';
  try { rows.value = await api(props.endpoint); }
  catch(e) { error.value = `加载失败：${e.message}`; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.endpoint, load);
</script>
