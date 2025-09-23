<script setup>
import { formatRatio } from '../utils/NumberFormatting';

defineProps({
  items: Array,
  loading: Boolean,
  error: String,
})

// Helper function to get color class based on value
const getMetricColor = (value, metric) => {
  if (!value || value === '-') return 'text-gray-400'
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return 'text-gray-400'
  
  switch (metric) {
    case 'pe':
      return numValue < 15 ? 'text-green-400' : numValue < 25 ? 'text-yellow-400' : 'text-red-400'
    case 'roe':
      return numValue > 15 ? 'text-green-400' : numValue > 10 ? 'text-yellow-400' : 'text-red-400'
    case 'debt':
      return numValue < 0.3 ? 'text-green-400' : numValue < 0.6 ? 'text-yellow-400' : 'text-red-400'
    case 'profit':
      return numValue > 20 ? 'text-green-400' : numValue > 10 ? 'text-yellow-400' : 'text-red-400'
    default:
      return 'text-white'
  }
}

// Helper function to get trend indicator
const getTrendIcon = (value, metric) => {
  if (!value || value === '-') return ''
  
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return ''
  
  switch (metric) {
    case 'pe':
      return numValue < 15 ? '↗️' : numValue > 25 ? '↘️' : '➡️'
    case 'roe':
      return numValue > 15 ? '↗️' : numValue < 10 ? '↘️' : '➡️'
    case 'debt':
      return numValue < 0.3 ? '↗️' : numValue > 0.6 ? '↘️' : '➡️'
    case 'profit':
      return numValue > 20 ? '↗️' : numValue < 10 ? '↘️' : '➡️'
    default:
      return ''
  }
}
</script>

<template>
  <section class="my-8">
    <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden backdrop-blur-sm">
      <!-- Enhanced Header -->
      <div class="px-8 py-6 bg-gradient-to-r from-indigo-900/30 to-blue-900/30 backdrop-blur-md border-b border-gray-700/50">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-white">Stock Comparison</h2>
            <p class="text-gray-400 text-sm">Fundamental Analysis & Key Metrics</p>
          </div>
          <div class="ml-auto">
            <div class="flex items-center space-x-2 text-xs text-gray-400">
              <span class="flex items-center"><span class="w-2 h-2 bg-green-400 rounded-full mr-1"></span>Good</span>
              <span class="flex items-center"><span class="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>Average</span>
              <span class="flex items-center"><span class="w-2 h-2 bg-red-400 rounded-full mr-1"></span>Poor</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <div class="relative">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <div class="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
        </div>
        <p class="text-gray-400 text-lg font-medium">Analyzing stocks...</p>
        <p class="text-gray-500 text-sm mt-1">Fetching fundamental data</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8">
        <div class="flex items-center justify-center p-8 bg-red-900/20 border border-red-500/30 rounded-xl">
          <svg class="w-8 h-8 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h3 class="text-red-400 font-semibold">Error Loading Data</h3>
            <p class="text-red-300 text-sm">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div v-else-if="items?.length" class="p-6">
        <div class="overflow-x-auto">
          <div class="bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="bg-gradient-to-r from-gray-800 to-gray-700">
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex items-center space-x-2">
                      <span>Symbol</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex items-center space-x-2">
                      <span>Company</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex flex-col items-center space-y-1">
                      <span>PE Ratio</span>
                      <span class="text-xs text-gray-500 font-normal">Price/Earnings</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex flex-col items-center space-y-1">
                      <span>ROE</span>
                      <span class="text-xs text-gray-500 font-normal">Return on Equity</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex flex-col items-center space-y-1">
                      <span>Debt/Equity</span>
                      <span class="text-xs text-gray-500 font-normal">Leverage Ratio</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
                    <div class="flex flex-col items-center space-y-1">
                      <span>Profit Margin</span>
                      <span class="text-xs text-gray-500 font-normal">Net Margin %</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700/50">
                <tr 
                  v-for="(row, index) in items" 
                  :key="row.symbol" 
                  class="group hover:bg-gray-800/50 transition-all duration-200"
                  :class="index % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-800/20'"
                >
                  <!-- Symbol -->
                  <td class="px-6 py-4 border-r border-gray-700/30">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <span class="text-white font-bold text-sm">{{ row.symbol.charAt(0) }}</span>
                      </div>
                      <div>
                        <span class="text-white font-bold text-lg">{{ row.symbol }}</span>
                        <div class="w-0 group-hover:w-8 h-0.5 bg-blue-500 transition-all duration-300"></div>
                      </div>
                    </div>
                  </td>

                  <!-- Company -->
                  <td class="px-6 py-4 border-r border-gray-700/30">
                    <div class="text-gray-300 font-medium group-hover:text-white transition-colors duration-200">
                      {{ row.companyName || 'N/A' }}
                    </div>
                  </td>

                  <!-- PE Ratio -->
                  <td class="px-6 py-4 text-center border-r border-gray-700/30">
                    <div class="flex items-center justify-center space-x-2">
                      <span class="text-lg font-bold" :class="getMetricColor(row.peRatio, 'pe')">
                        {{ formatRatio(row.peRatio) ?? '-' }}
                      </span>
                      <span class="text-sm">{{ getTrendIcon(row.peRatio, 'pe') }}</span>
                    </div>
                  </td>

                  <!-- ROE -->
                  <td class="px-6 py-4 text-center border-r border-gray-700/30">
                    <div class="flex items-center justify-center space-x-2">
                      <span class="text-lg font-bold" :class="getMetricColor(row.roe, 'roe')">
                        {{ formatRatio(row.roe) ?? '-' }}%
                      </span>
                      <span class="text-sm">{{ getTrendIcon(row.roe, 'roe') }}</span>
                    </div>
                  </td>

                  <!-- Debt/Equity -->
                  <td class="px-6 py-4 text-center border-r border-gray-700/30">
                    <div class="flex items-center justify-center space-x-2">
                      <span class="text-lg font-bold" :class="getMetricColor(row.debtEquity, 'debt')">
                        {{ formatRatio(row.debtEquity) ?? '-' }}
                      </span>
                      <span class="text-sm">{{ getTrendIcon(row.debtEquity, 'debt') }}</span>
                    </div>
                  </td>

                  <!-- Profit Margin -->
                  <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center space-x-2">
                      <span class="text-lg font-bold" :class="getMetricColor(row.profitMargin, 'profit')">
                        {{ formatRatio(row.profitMargin) ?? '-' }}%
                      </span>
                      <span class="text-sm">{{ getTrendIcon(row.profitMargin, 'profit') }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-4 border border-green-700/30">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-400 rounded-full"></div>
              <span class="text-green-400 font-semibold text-sm">Best Performers</span>
            </div>
            <p class="text-white text-lg font-bold mt-1">{{ items.filter(item => parseFloat(item.roe) > 15).length }}</p>
            <p class="text-green-300 text-xs">High ROE Stocks</p>
          </div>

          <div class="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-4 border border-blue-700/30">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span class="text-blue-400 font-semibold text-sm">Value Plays</span>
            </div>
            <p class="text-white text-lg font-bold mt-1">{{ items.filter(item => parseFloat(item.peRatio) < 15).length }}</p>
            <p class="text-blue-300 text-xs">Low PE Ratio</p>
          </div>

          <div class="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-4 border border-purple-700/30">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span class="text-purple-400 font-semibold text-sm">Low Debt</span>
            </div>
            <p class="text-white text-lg font-bold mt-1">{{ items.filter(item => parseFloat(item.debtEquity) < 0.3).length }}</p>
            <p class="text-purple-300 text-xs">Conservative Leverage</p>
          </div>

          <div class="bg-gradient-to-br from-yellow-900/30 to-orange-800/30 rounded-xl p-4 border border-yellow-700/30">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span class="text-yellow-400 font-semibold text-sm">High Margin</span>
            </div>
            <p class="text-white text-lg font-bold mt-1">{{ items.filter(item => parseFloat(item.profitMargin) > 20).length }}</p>
            <p class="text-yellow-300 text-xs">Profitable Companies</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="mb-4">
          <svg class="w-16 h-16 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <h3 class="text-gray-400 text-lg font-medium mb-2">No Data Available</h3>
        <p class="text-gray-500 text-sm">Stock comparison data will appear here when loaded</p>
      </div>
    </div>
  </section>
</template>