<template>
  <Teleport to="body">
    <div v-if="open" class="modal-mask" @click.self="close">
      <section class="modal-card">
        <header class="modal-head">
          <div>
            <p class="eyebrow">FORM</p>
            <h2>{{ mode === 'create' ? `新增${title}` : `编辑${title}` }}</h2>
          </div>
          <button class="icon-btn" type="button" @click="close">×</button>
        </header>
        <div class="modal-body">
          <label v-for="field in fields" :key="field.key" class="modal-field">
            <span>{{ field.title }}</span>
            <select v-if="field.options?.length" v-model="draft[field.key]">
              <option value="">请选择</option>
              <option v-for="option in field.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
            <textarea v-else-if="field.type === 'textarea'" v-model="draft[field.key]" rows="3" />
            <input v-else v-model="draft[field.key]" :placeholder="`请输入${field.title}`" />
          </label>
        </div>
        <footer class="modal-foot">
          <button class="ghost-btn" type="button" @click="close">取消</button>
          <button type="button" @click="submit">保存草稿</button>
        </footer>
      </section>
    </div>
  </Teleport>
</template>
<script setup>
import { reactive, watch } from 'vue';
const props = defineProps({
  open: Boolean,
  title: String,
  mode: { type: String, default: 'create' },
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) }
});
const emit = defineEmits(['close', 'submit']);
const draft = reactive({});
watch(
  () => [props.open, props.modelValue, props.fields],
  () => {
    Object.keys(draft).forEach((key) => delete draft[key]);
    props.fields.forEach((field) => {
      draft[field.key] = props.modelValue?.[field.key] ?? '';
    });
  },
  { immediate: true, deep: true }
);
function close() {
  emit('close');
}
function submit() {
  emit('submit', { ...draft });
}
</script>
