<template>
  <span class="ash-badge" :class="`ash-badge--${tone}`"><slot /></span>
</template>
<script setup>
defineProps({ tone: { type: String, default: 'muted' } });
</script>
