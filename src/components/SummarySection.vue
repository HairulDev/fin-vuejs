<script setup>
import { TrendingUp, TrendingDown, Activity, Layers } from 'lucide-vue-next'

defineProps({
  totalValue: {
    type: Number,
    required: true
  },
  totalGain: {
    type: Number,
    required: true
  },
  portfolioItems: {
    type: Array,
    required: true
  },
  stocksCount: {
    type: Number,
    required: true
  },
  openStocksModal: {
    type: Function,
    required: true
  }
})
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
    <!-- Total Portfolio -->
    <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400">Total Portfolio</p>
          <p class="text-2xl font-bold text-white">${{ totalValue.toLocaleString() }}</p>
        </div>
        <div
          :class="{
            'text-red-400': totalGain < 0,
            'text-green-400': totalGain >= 0,
            'text-sm flex items-center': true
          }"
        >
          <span class="text-xs">
            <TrendingUp v-if="totalGain >= 0" class="w-3 h-3 text-green-400" />
            <TrendingDown v-else class="w-3 h-3 text-red-400" />
          </span>
          <span class="ml-1">
            {{ totalGain >= 0 ? '+' : '' }}{{ totalGain }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Active Positions -->
    <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400">Active Positions</p>
          <p class="text-2xl font-bold text-white">{{ portfolioItems.length }}</p>
        </div>
        <div class="text-blue-400 text-sm">
          <Activity class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Stocks Internal -->
    <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400">Stocks Internal
            <button 
              @click="openStocksModal" 
              class="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Show
            </button>
          </p>
          <p class="text-2xl font-bold text-white">{{ stocksCount }}</p>
        </div>
        <div class="text-blue-400 text-sm">
          <Layers class="w-5 h-5" />
        </div>
      </div>
    </div>

    <!-- Market Status -->
    <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-400">Market Status</p>
          <p class="text-lg font-semibold text-green-400">Open</p>
        </div>
        <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
</template>