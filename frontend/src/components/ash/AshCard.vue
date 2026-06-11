<template>
  <article class="ash-card" :class="{ 'ash-card--quiet': quiet }">
    <header v-if="$slots.title || eyebrow" class="ash-card__head">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
      <h2 v-if="$slots.title"><slot name="title" /></h2>
    </header>
    <slot />
  </article>
</template>
<script setup>
defineProps({ eyebrow: String, quiet: Boolean });
</script>
