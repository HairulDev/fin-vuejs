  <script setup>
  import DividendChart from './DividendChart.vue'
  
  defineProps({
    items: Array,
    dividends: Object,
    loading: Boolean,
    error: String
  })
  
  defineEmits(['delete', 'open-notes'])
  </script>
  
<template>
    <div class="bg-gray-800 rounded-lg border border-gray-700">
      <div class="px-6 py-2 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-white">Your Portfolio</h2>
      </div>
  
      <div class="p-6">
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <p class="text-gray-400 mt-2">Loading portfolio...</p>
        </div>
  
        <p v-else-if="error" class="text-red-400 text-center py-8">{{ error }}</p>
  
        <div v-else-if="items.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="bg-gray-800 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-lg"
          >
            <!-- Stock Header -->
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="font-bold text-lg text-blue-400">{{ item.symbol }}</h3>
                <p class="text-2xl font-bold text-white mt-1">${{ item.price }}</p>
              </div>
              <button 
                @click="$emit('delete', item.symbol)" 
                class="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-gray-600"
                title="Remove from portfolio"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
  
            <!-- Dividend Chart -->
            <div class="mt-4">
              <div v-if="dividends[item.symbol]?.length" class="h-32 mb-3">
                <DividendChart :data="dividends[item.symbol]" />
              </div>
              <div v-else class="h-32 flex items-center justify-center bg-gray-800 rounded border border-gray-600 mb-3">
                <p class="text-gray-500 text-sm">No dividend data available</p>
              </div>
              
              <!-- Chart Label -->
              <div class="flex items-center justify-between text-xs text-gray-400 gap-2">
                <span v-if="dividends[item.symbol]?.length">
                  Dividend History {{ dividends[item.symbol].length }} records
                </span>
                <button
                  @click="$emit('open-notes', item.symbol)"
                  class="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  Notes
                </button>
              </div>
            </div>
          </div>
        </div>
  
        <div v-else class="text-center py-12">
          <div class="text-gray-500 mb-4">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p class="text-lg font-medium">No stocks in portfolio</p>
            <p class="text-sm">Search and add stocks to get started</p>
          </div>
        </div>
      </div>
    </div>
  </template>