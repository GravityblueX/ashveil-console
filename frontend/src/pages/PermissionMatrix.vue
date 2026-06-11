<template>
  <div class="page">
    <p class="eyebrow">ACCESS MATRIX</p>
    <h1>角色权限矩阵</h1>
    <section class="panel">
      <div v-if="loading" class="state">正在加载权限矩阵...</div>
      <div v-else-if="error" class="state error-box">{{ error }}</div>
      <div v-else class="matrix-wrap">
        <div class="matrix-summary">
          <article v-for="role in roles" :key="role.code" class="matrix-card">
            <span>{{ role.name }}</span>
            <strong>{{ grantedCount(role.code) }}</strong>
            <em>已授权动作</em>
          </article>
        </div>
        <table class="permission-table">
          <thead>
            <tr>
              <th>资源</th>
              <th>动作</th>
              <th v-for="role in roles" :key="role.code">{{ role.name }}</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="resource in matrix.resources" :key="resource.key">
              <tr v-for="(action, index) in resource.actions" :key="resource.key + action">
                <td v-if="index === 0" :rowspan="resource.actions.length" class="resource-cell">{{ resource.name }}</td>
                <td><code>{{ action }}</code></td>
                <td v-for="role in roles" :key="role.code" class="grant-cell">
                  <button class="grant-toggle" :class="{ active: hasGrant(role.code, resource.key, action) }" type="button" @click="toggleGrant(role.code, resource.key, action)">
                    {{ hasGrant(role.code, resource.key, action) ? '允许' : '拒绝' }}
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <p class="matrix-note">当前矩阵为前端交互原型，切换结果会保留在当前页面状态中，后续可接入真实权限保存接口。</p>
      </div>
    </section>
  </div>
</template>
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api } from '../api';
const loading = ref(false);
const error = ref('');
const roles = ref([]);
const matrix = reactive({ resources: [], grants: {} });
const totalActions = computed(() => matrix.resources.reduce((sum, item) => sum + item.actions.length, 0));
function key(resource, action){ return `${resource}:${action}`; }
function hasGrant(role, resource, action){ return matrix.grants[role]?.includes(key(resource, action)); }
function toggleGrant(role, resource, action){
  const grantKey = key(resource, action);
  matrix.grants[role] = matrix.grants[role] || [];
  if (matrix.grants[role].includes(grantKey)) matrix.grants[role] = matrix.grants[role].filter(item => item !== grantKey);
  else matrix.grants[role].push(grantKey);
}
function grantedCount(role){ return `${matrix.grants[role]?.length || 0}/${totalActions.value}`; }
onMounted(async () => {
  loading.value = true;
  try {
    const [roleRows, matrixData] = await Promise.all([api('/access/roles'), api('/access/permission-matrix')]);
    roles.value = roleRows;
    matrix.resources = matrixData.resources;
    matrix.grants = JSON.parse(JSON.stringify(matrixData.grants));
  } catch(e) { error.value = `加载失败：${e.message}`; }
  finally { loading.value = false; }
});
</script>
