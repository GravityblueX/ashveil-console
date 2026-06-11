<template>
  <div class="page">
    <p class="eyebrow">MODULE</p><h1>{{ title }}</h1>
    <section class="panel"><pre>{{ rows }}</pre></section>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';
const props = defineProps({ title: String, endpoint: String });
const rows = ref([]);
onMounted(async()=> rows.value = await api(props.endpoint));
</script>
