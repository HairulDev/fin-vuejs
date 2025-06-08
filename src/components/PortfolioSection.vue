
<script setup>
import { BadgePlus } from 'lucide-vue-next'
import ModalSearchPortfolio from './ModalSearchPortfolio.vue'
import PortfolioList from './PortfolioList.vue'

const props = defineProps({
  showSearchSection: Boolean,
  searchQuery: String,
  searchResults: Array,
  searchLoading: Boolean,
  searchError: String,
  showSuggestions: Boolean,
  portfolioItems: Array,
  portfolioDividends: Object,
  portfolioLoading: Boolean,
  portfolioError: String
})

const emit = defineEmits([
  'update:showSearchSection',
  'update:searchQuery',
  'search',
  'clear',
  'select',
  'delete',
  'open-notes'
])

const toggleSearchSection = () => {
  emit('update:showSearchSection', !props.showSearchSection)
}

const closeSearchSection = () => {
  emit('update:showSearchSection', false)
}

const updateSearchQuery = (query) => {
  emit('update:searchQuery', query)
}

const handleSearch = () => {
  emit('search')
}

const clearSearch = () => {
  emit('clear')
}

const selectSuggestion = (item) => {
  emit('select', item)
}

const deletePortfolio = (symbol) => {
  emit('delete', symbol)
}

const openNotesModal = (symbol) => {
  emit('open-notes', symbol)
}
</script>
<template>
    <div class="min-h-screen bg-gray-900 text-white">
      <div class="px-6 py-6">
        <button 
          @click="toggleSearchSection" 
          class="px-3 py-1 mb-2 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <BadgePlus class="w-4 h-4" />Portfolio
        </button>
  
        <ModalSearchPortfolio
          v-if="showSearchSection"
          :query="searchQuery"
          :results="searchResults"
          :loading="searchLoading"
          :error="searchError"
          :show-suggestions="showSuggestions"
          @update:query="val => searchQuery = val"
          @update:show-suggestions="val => showSuggestions = val"
          @search="handleSearch"
          @clear="clearSearch"
          @select="selectSuggestion"
          @close="closeSearchSection"
        />

  
        <PortfolioList
          :items="portfolioItems"
          :dividends="portfolioDividends"
          :loading="portfolioLoading"
          :error="portfolioError"
          @delete="deletePortfolio"
          @open-notes="openNotesModal"
        />
      </div>
    </div>
  </template>
