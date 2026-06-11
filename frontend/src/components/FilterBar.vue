<template>
  <div class="filter-bar">
    <div class="filter-main">
      <label class="filter-field keyword-field">
        <span>关键词</span>
        <input v-model="local.keyword" placeholder="搜索当前模块的数据" @keyup.enter="apply" />
      </label>
      <label v-if="statusOptions.length" class="filter-field">
        <span>状态/级别</span>
        <select v-model="local.status">
          <option value="">全部</option>
          <option v-for="option in statusOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>
      <label v-if="channelOptions.length" class="filter-field">
        <span>渠道</span>
        <select v-model="local.channel">
          <option value="">全部</option>
          <option v-for="option in channelOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>
    </div>
    <div class="filter-actions">
      <button type="button" class="ghost-btn" @click="reset">重置</button>
      <button type="button" @click="apply">搜索</button>
    </div>
  </div>
</template>
<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({
  modelValue: { type: Object, default: () => ({ keyword: '', status: '', channel: '' }) },
  statusOptions: { type: Array, default: () => [] },
  channelOptions: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue', 'search', 'reset']);
const local = reactive({ keyword: '', status: '', channel: '' });
watch(
  () => props.modelValue,
  (value) => Object.assign(local, value || {}),
  { immediate: true, deep: true }
);
function apply() {
  const payload = { keyword: local.keyword.trim(), status: local.status, channel: local.channel };
  emit('update:modelValue', payload);
  emit('search', payload);
}
function reset() {
  const payload = { keyword: '', status: '', channel: '' };
  Object.assign(local, payload);
  emit('update:modelValue', payload);
  emit('reset', payload);
}
</script>
