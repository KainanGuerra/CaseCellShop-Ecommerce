<script setup lang="ts">
const props = defineProps<{ stock: number }>()
</script>

<template>
  <span
    v-if="props.stock > 0"
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
  >
    Em estoque ({{ props.stock }})
  </span>
  <span
    v-else
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
  >
    Esgotado
  </span>
</template>
