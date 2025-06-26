<script setup>
const props = defineProps({
  showModal: Boolean,
  url: String
})

const emit = defineEmits(['update:showModal'])
</script>

<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
  >
    <div class="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh]">
      <div class="flex justify-between items-center p-2 bg-gray-800 text-white">
        <h3 class="text-sm font-semibold">File Preview</h3>
        <button @click="$emit('update:showModal', false)" class="text-white text-xl">&times;</button>
      </div>
      <div class="p-2">
        <iframe
          :src="url"
          class="w-full h-[80vh]"
          frameborder="0"
        ></iframe>
      </div>
    </div>
  </div>
</template>