<template>
  <div class="min-h-screen bg-gray-900">
    <div class="container mx-auto px-4 py-4">
      <!-- Toggle Sidebar -->
      <div class="top-4 left-4 z-50">
        <button @click="toggleSidebar" class="bg-blue-600 text-white p-2 rounded-lg shadow hover:bg-blue-700 transition-colors">
          <component :is="isOpen ? X : Menu" class="w-5 h-5" />
        </button>
        <!-- tambahkan text disini -->
        <span class="text-white ml-2">Welcome to Hairul Project Portfolio</span>
      </div>

      <div class="">
        <Sidebar :isOpen="isOpen" @update:isOpen="isOpen = $event" />
        <div class="lg:col-span-3">
          <!-- router-view -->
          <router-view />
        </div>
      </div>

      <!-- Overlay for Sidebar -->
      <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-30" @click="isOpen = false"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Menu, X } from 'lucide-vue-next';
import Sidebar from './components/Sidebar.vue';

const isOpen = ref(false);
const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};
</script>
