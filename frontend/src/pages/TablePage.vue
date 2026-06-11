<template>
  <div class="page">
    <p class="eyebrow">MODULE</p><h1>{{ title }}</h1>
    <section class="panel">
      <FilterBar v-model="filters" :status-options="statusOptions" :channel-options="channelOptions" @search="applyFilters" @reset="applyFilters" />
      <div class="table-meta">
        <span>共 {{ tableRows.length }} 条</span>
        <span v-if="isFiltering">已筛选 {{ filteredRows.length }} 条</span>
      </div>
      <div v-if="loading" class="state">正在加载 {{ title }} 数据...</div>
      <div v-else-if="error" class="state error-box">{{ error }}</div>
      <DataTable v-else :rows="filteredRows" :columns="columns" :actions="actions" />
    </section>
  </div>
</template>
<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { api } from '../api';
import DataTable from '../components/DataTable.vue';
import FilterBar from '../components/FilterBar.vue';
const props = defineProps({ title: String, endpoint: String });
const rows = ref(null);
const loading = ref(false);
const error = ref('');
const filters = reactive({ keyword: '', status: '', channel: '' });
const tableRows = computed(() => normalizeRows(rows.value));
const columns = computed(() => columnMap[props.endpoint] || inferColumns(tableRows.value));
const actions = computed(() => props.endpoint === '/monitor' ? ['详情'] : ['查看', '编辑']);
const isFiltering = computed(() => Boolean(filters.keyword || filters.status || filters.channel));
const statusOptions = computed(() => uniqueValues(tableRows.value, ['status', 'level']));
const channelOptions = computed(() => uniqueValues(tableRows.value, ['channel']));
const filteredRows = computed(() => {
  const keyword = filters.keyword.toLowerCase();
  return tableRows.value.filter(row => {
    const textMatched = !keyword || Object.values(row).some(value => String(Array.isArray(value) ? value.join(' ') : value ?? '').toLowerCase().includes(keyword));
    const statusMatched = !filters.status || [row.status, row.level].includes(filters.status);
    const channelMatched = !filters.channel || row.channel === filters.channel;
    return textMatched && statusMatched && channelMatched;
  });
});
const columnMap = {
  '/access/users': [
    { key: 'id', title: 'ID' }, { key: 'username', title: '账号' }, { key: 'nickname', title: '昵称' },
    { key: 'dept', title: '部门' }, { key: 'roles', title: '角色', type: 'list' }, { key: 'status', title: '状态', type: 'tag' }, { key: 'lastLogin', title: '最后登录' }
  ],
  '/system/dictionaries': [
    { key: 'type', title: '字典编码' }, { key: 'name', title: '字典名称' }, { key: 'items', title: '字典项', type: 'list' }
  ],
  '/audit/logs': [
    { key: 'id', title: '日志ID' }, { key: 'actor', title: '操作者' }, { key: 'action', title: '动作' },
    { key: 'channel', title: '渠道' }, { key: 'level', title: '级别', type: 'tag' }, { key: 'time', title: '时间' }
  ],
  '/jobs': [
    { key: 'id', title: '任务ID' }, { key: 'name', title: '任务名称' }, { key: 'cron', title: 'Cron' },
    { key: 'status', title: '状态', type: 'tag' }, { key: 'successRate', title: '成功率' }
  ],
  '/monitor': [
    { key: 'name', title: '节点/指标' }, { key: 'status', title: '状态', type: 'tag' }, { key: 'value', title: '数值' }, { key: 'latency', title: '延迟' }
  ]
};
function normalizeRows(value){
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (value.nodes) {
    return [
      { name: 'API 运行时间', status: 'info', value: value.api?.uptime, latency: '-' },
      { name: 'CPU 占用', status: 'info', value: `${value.api?.cpu}%`, latency: '-' },
      { name: '内存占用', status: 'warning', value: `${value.api?.memory}%`, latency: '-' },
      { name: 'QPS', status: 'healthy', value: value.api?.qps, latency: '-' },
      ...value.nodes.map(node => ({ ...node, value: '在线' }))
    ];
  }
  return Object.entries(value).map(([key, val]) => ({ name: key, value: val }));
}
function inferColumns(data){
  const sample = data[0] || {};
  return Object.keys(sample).map(key => ({ key, title: key }));
}
function uniqueValues(data, keys){
  return [...new Set(data.flatMap(row => keys.map(key => row[key]).filter(Boolean)))];
}
function applyFilters(payload){ Object.assign(filters, payload); }
async function load(){
  loading.value = true;
  error.value = '';
  try { rows.value = await api(props.endpoint); }
  catch(e) { error.value = `加载失败：${e.message}`; }
  finally { loading.value = false; }
}
onMounted(load);
watch(() => props.endpoint, () => { Object.assign(filters, { keyword: '', status: '', channel: '' }); load(); });
</script>
