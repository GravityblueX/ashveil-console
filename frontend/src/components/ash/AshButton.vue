<template>
  <button
    class="ash-button"
    :class="[`ash-button--${variant}`, { 'is-block': block }]"
    :type="type"
  >
    <slot />
  </button>
</template>
<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
  type: { type: String, default: 'button' },
  block: Boolean
});
</script>
