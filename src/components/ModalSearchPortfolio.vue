<script setup>
import { Search } from 'lucide-vue-next'

defineProps({
  query: String,
  results: Array,
  loading: Boolean,
  error: String,
  showSuggestions: Boolean
})

const emit = defineEmits([
  'update:query',
  'update:show-suggestions',
  'search',
  'clear',
  'select',
  'close'
])
</script>

<template>
    <div class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div class="bg-gray-800 rounded-lg p-6 h-[500px] w-full max-w-md border border-gray-600 flex flex-col">
        <h2 class="text-lg font-semibold mb-4 text-gray-200">Add Stock to Portfolio</h2>
        
        <!-- Search Input -->
        <div class="flex flex-col md:flex-row gap-3 relative">
          <div class="relative flex-1">
            <input
              :value="query"
              @input="e => {
                $emit('update:query', e.target.value)
                $emit('update:show-suggestions', true)
              }"
              type="text"
              placeholder="Search stocks (e.g., AAPL, MSFT, GOOGL)..."
              class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
            />

            <button
              v-if="query"
              @click="$emit('clear')"
              class="absolute inset-y-0 right-3 text-gray-400 hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
          <button
            @click="$emit('search')"
            :disabled="loading"
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            <Search class="w-5 h-5" />
          </button>
  
          <!-- Autocomplete suggestions -->
          <div
            v-if="showSuggestions && results.length"
            class="absolute z-20 top-full left-0 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1"
          >
            <div
              v-for="item in results"
              :key="item.symbol"
              @click="$emit('select', item)"
              class="px-4 py-3 cursor-pointer hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
            >
              <div class="font-medium text-white">{{ item.name }}</div>
              <div class="text-sm text-gray-400">{{ item.symbol }} • {{ item.exchangeShortName }}</div>
            </div>
          </div>
        </div>
  
        <p v-if="error" class="text-red-400 mt-3 text-sm">{{ error }}</p>
  
        <div class="mt-auto pt-4">
          <button
            @click="$emit('close')"
            class="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </template>
  