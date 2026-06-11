<template>
  <article class="ash-metric" :class="`ash-metric--${tone}`">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <em v-if="hint">{{ hint }}</em>
  </article>
</template>
<script setup>
defineProps({
  label: String,
  value: [String, Number],
  hint: String,
  tone: { type: String, default: 'default' }
});
</script>
