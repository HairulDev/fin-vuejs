
<script setup>
import {  formatRatio } from '../utils/NumberFormatting';

defineProps({
  items: Array,
  loading: Boolean,
  error: String,
})
</script>


<template>
    <section class="my-6">
    <div class="bg-gray-800 rounded-lg border border-gray-700">
      <div class="px-6 py-2 border-b border-gray-700">
        <h2 class="text-xl font-semibold text-white">Company Comparison</h2>
      </div>
  
      <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
          <p class="text-gray-400 mt-2">Loading...</p>
        </div>

        <div v-else-if="error" class="text-red-400">{{ error }}</div>

      <div v-else-if="items.length" class="p-2">
        <table class="w-full table-auto bg-gray-800 text-white rounded-md overflow-hidden">
          <thead>
            <tr class="bg-gray-700">
              <th class="p-2 text-left">Symbol</th>
              <th class="p-2 text-left">Company</th>
              <th class="p-2 text-left">PE Ratio</th>
              <th class="p-2 text-left">ROE</th>
              <th class="p-2 text-left">Debt/Equity</th>
              <th class="p-2 text-left">Profit Margin</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in items" :key="row.symbol" class="hover:bg-gray-600">
              <td class="p-2">{{ row.symbol }}</td>
              <td class="p-2">{{ row.companyName }}</td>
              <td class="p-2">{{ formatRatio(row.peRatio) ?? '-' }}</td>
              <td class="p-2">{{ formatRatio(row.roe) ?? '-' }}</td>
              <td class="p-2">{{ formatRatio(row.debtEquity) ?? '-' }}</td>
              <td class="p-2">{{ formatRatio(row.profitMargin) ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
    </section>
  </template>
    