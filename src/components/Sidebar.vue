<script setup>
import { useRouter, useRoute } from 'vue-router';
import { Home, User, LogOut } from 'lucide-vue-next';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['update:isOpen']);

const router = useRouter();
const route = useRoute();

const menues = [
  { title: "Home", path: "/home", icon: Home },
];

const currentPath = route.path;

const selectMenu = (menu) => {
  router.push(menu.path);
  emit('update:isOpen', false);
};

const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  emit('update:isOpen', false);
  router.push("/login");
};
</script>

<template>
  <div :class="['fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 p-6 transform transition-transform duration-300', isOpen ? 'translate-x-0' : '-translate-x-full', 'lg:col-span-1 overflow-y-auto max-h-screen']">
    <div class="space-y-2">
      <button
        v-for="menu in menues"
        :key="menu.path"
        @click="selectMenu(menu)"
        :class="['w-full text-left p-3 rounded-lg flex items-center gap-2 transition',
          currentPath === menu.path ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'hover:bg-gray-50 text-gray-400']"
      >
        <component :is="menu.icon" class="w-4 h-4" />
        <span class="font-medium text-sm">{{ menu.title }}</span>
      </button>

      <button
        @click="logout"
        class="w-full text-left p-3 rounded-lg flex items-center gap-2 hover:bg-gray-50 text-gray-400 transition"
      >
        <LogOut class="w-4 h-4" /> <!-- fix: ganti User dengan LogOut -->
        <span class="font-medium text-sm">Logout</span>
      </button>
    </div>
  </div>
</template>
