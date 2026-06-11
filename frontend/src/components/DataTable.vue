<template>
  <div class="table-wrap">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="column in normalizedColumns" :key="column.key">{{ column.title }}</th>
          <th v-if="actions.length">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in rows" :key="row.id ?? index">
          <td v-for="column in normalizedColumns" :key="column.key">
            <span v-if="column.type === 'tag'" class="tag" :class="tagClass(row[column.key])">{{ displayValue(row[column.key]) }}</span>
            <span v-else-if="column.type === 'list'" class="inline-list">{{ displayValue(row[column.key]) }}</span>
            <span v-else>{{ displayValue(row[column.key]) }}</span>
          </td>
          <td v-if="actions.length" class="table-actions">
            <button v-for="action in actions" :key="action" class="ghost-btn" type="button">{{ action }}</button>
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="normalizedColumns.length + (actions.length ? 1 : 0)" class="empty-cell">暂无数据</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup>
import { computed } from 'vue';
const props = defineProps({
  rows: { type: Array, default: () => [] },
  columns: { type: Array, default: () => [] },
  actions: { type: Array, default: () => ['查看', '编辑'] }
});
const normalizedColumns = computed(() => {
  if (props.columns.length) return props.columns;
  const sample = props.rows[0] || {};
  return Object.keys(sample).map(key => ({ key, title: key }));
});
function displayValue(value){
  if (Array.isArray(value)) return value.join('、');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return value ?? '-';
}
function tagClass(value){
  const text = String(value || '').toLowerCase();
  if (['active','running','healthy','info','low'].includes(text)) return 'tag-ok';
  if (['warning','medium','degraded','paused'].includes(text)) return 'tag-warn';
  if (['critical','locked','disabled','high'].includes(text)) return 'tag-danger';
  return 'tag-muted';
}
</script>
