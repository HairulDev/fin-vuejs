<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue'

import { saveToLocalStorage, getFromLocalStorage } from '../utils/storageUtils'
import { usePortfolioStore } from '../stores/usePortfolioStore'
import * as portfolioService from '../services/portfolioService'
import * as stockService from '../services/stockService'
import * as noteService from '../services/noteService'

import SummarySection from '../components/SummarySection.vue'
import ModalStock from '../components/ModalStock.vue'
import CompanyComparison from '../components/CompanyComparisonSection.vue'
import PortfolioSection from '../components/PortfolioSection.vue'
import ModalNotes from '../components/ModalNotes.vue'
import ModalPreview from '../components/ModalPreview.vue'

const token = localStorage.getItem('token')
const STORAGE_KEY = "totalPortfolios"

const {
  state,
  stockErrors,
  handleStockSubmit,
  resetStockForm,
  setValues,
  totalValue
} = usePortfolioStore()

const totalValueOld = ref(getFromLocalStorage(STORAGE_KEY) || totalValue.value)

const totalGain = computed(() => {
  if (totalValueOld.value === 0) return 0
  return Math.ceil(totalValue.value - totalValueOld.value)
})

watchEffect(() => {
  const savedTotalValue = getFromLocalStorage(STORAGE_KEY)
  if (!savedTotalValue) {
    saveToLocalStorage(STORAGE_KEY, totalValue.value)
  }
})

// Portfolio methods
const searchStocks = () => portfolioService.searchStocks(state, state.search.query)
const clearSearch = () => {
  state.search.query = ''
  state.search.showSuggestions = false
  state.search.results = []
}
const selectSuggestion = (item) => {
  state.search.query = `${item.name} (${item.symbol})`
  state.search.showSuggestions = false
  portfolioService.addToPortfolio(state, token, item.symbol)
}
const deletePortfolio = (symbol) => portfolioService.deletePortfolio(state, token, symbol)

// Stock methods
const loadStocks = () => stockService.loadStocks(state, token)
const saveStock = handleStockSubmit((values) => stockService.saveStock(state, token, values))
const updateStock = handleStockSubmit((values) => stockService.updateStock(state, token, values))
const startEditingStock = (stockId) => stockService.startEditingStock(state, token, stockId)
const deleteStock = (stockId) => stockService.deleteStock(state, token, stockId)

const onSubmitStock = (e) => {
  e.preventDefault()
  if (state.stocks.isEditing) {
    updateStock(state.stocks.form)
  } else {
    saveStock(state.stocks.form)
  }
}

// Note methods
const loadNotes = () => noteService.loadNotes(state, token)
const openNotesModal = (symbol) => {
  state.notes.selectedSymbol = symbol
  state.notes.title = ''
  state.notes.content = ''
  state.notes.list = []
  loadNotes()
  state.notes.showModal = true
}
const startEditingNote = (noteId, action) => noteService.startEditingNote(state, token, noteId, action)
const saveNote = () => noteService.saveNote(state, token)
const updateNote = () => noteService.updateNote(state, token)
const deleteNote = (noteId) => noteService.deleteNote(state, token, noteId)
const resetNoteForm = () => noteService.resetNoteForm(state)
const previewFile = (file) => {
  state.preview.url = `http://localhost:8080/download/${file}`
  state.preview.showModal = true
}
const deleteFile = (file) => noteService.deleteFile(state, file)

// UI methods
const openStocksModal = () => {
  resetStockForm()
  state.stocks.modalStep = 1
  state.stocks.list = []
  loadStocks()
  state.stocks.showModal = true
}

const backToStockList = () => {
  state.stocks.modalStep = 1
}

const closeStock = () => {
  state.stocks.search.symbol = ''
  state.stocks.search.companyName = ''
  state.stocks.search.sortBy = 'Symbol'
  state.stocks.search.isDescending = false
  state.stocks.search.pageNumber = 1
  state.stocks.search.pageSize = 999

  loadStocks()
  state.stocks.showModal = false
}

const resetForm = () => {
  resetStockForm()
  state.stocks.editingId = null
  state.stocks.isEditing = false
  state.stocks.modalStep = 1
}




// Lifecycle hooks
onMounted(() => {
  portfolioService.loadPortfolio(state, token)
  portfolioService.loadPortfolioComparison(state, token)
})

console.log("state.comparison.items ===>>",state.comparison.items)

watchEffect(() => {
  loadStocks()
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <div class="px-6 py-6">
      <!-- Summary Section -->
      <SummarySection
        :total-value="totalValue"
        :total-gain="totalGain"
        :portfolio-items="state.portfolio.items"
        :stocks-count="state.stocks.list.length"
        :open-stocks-modal="openStocksModal"
      />
      
      <CompanyComparison
        :items="state.comparison.items"
        :loading="state.comparison.loading"
        :error="state.comparison.error"
      />


      <!-- Modal Stock -->
      <ModalStock
        :show-modal="state.stocks.showModal"
        :modal-step="state.stocks.modalStep"
        :is-editing="state.stocks.isEditing"
        :loading="state.portfolio.loading"
        :search="state.stocks.search"
        :stocks-list="state.stocks.list"
        :form="state.stocks.form"
        :editing-id="state.stocks.editingId"
        :errors="stockErrors"
        @update:modal-step="val => state.stocks.modalStep = val"
        @update:is-editing="val => state.stocks.isEditing = val"
        @update:search="val => state.stocks.search = val"
        @update:form="val => state.stocks.form = val"
        @update:editing-id="val => state.stocks.editingId = val"
        @close="closeStock"
        @loadStocks="loadStocks"
        @startEditingStock="startEditingStock"
        @deleteStock="deleteStock"
        @prevPage="prevPage"
        @nextPage="nextPage"
        @backToStockList="backToStockList"
        @resetForm="resetForm"
        @onSubmitStock="onSubmitStock"
      />

      <!-- Portfolio Section -->
      <PortfolioSection
        :show-search-section="state.ui.showSearchSection"
        :search-query="state.search.query"
        :search-results="state.search.results"
        :search-loading="state.search.loading"
        :search-error="state.search.error"
        :show-suggestions="state.search.showSuggestions"
        :portfolio-items="state.portfolio.items"
        :portfolio-dividends="state.portfolio.dividends"
        :portfolio-loading="state.portfolio.loading"
        :portfolio-error="state.portfolio.error"
        @update:show-search-section="val => state.ui.showSearchSection = val"
        @update:search-query="val => state.search.query = val"
        @search="searchStocks"
        @clear="clearSearch"
        @select="selectSuggestion"
        @delete="deletePortfolio"
        @open-notes="openNotesModal"
      />

      <!-- Modal Notes -->
      <ModalNotes
        :show-modal="state.notes.showModal"
        :selected-symbol="state.notes.selectedSymbol"
        :notes-list="state.notes.list"
        :is-descending="state.notes.isDescending"
        :action="state.notes.action"
        :title="state.notes.title"
        :content="state.notes.content"
        :file-paths="state.notes.filePaths"
        :selected-files="state.notes.selectedFiles"
        :is-editing="state.notes.isEditing"
        :editing-id="state.notes.editingId"
        @update:is-descending="val => state.notes.isDescending = val"
        @update:title="val => state.notes.title = val"
        @update:content="val => state.notes.content = val"
        @update:selected-files="val => state.notes.selectedFiles = val"
        @update:show-modal="val => state.notes.showModal = val"
        @startEditingNote="startEditingNote"
        @deleteNote="deleteNote"
        @saveNote="saveNote"
        @updateNote="updateNote"
        @resetNoteForm="resetNoteForm"
        @previewFile="previewFile"
        @deleteFile="deleteFile"
      />

      <!-- Modal Preview -->
      <ModalPreview
        :show-modal="state.preview.showModal"
        :url="state.preview.url"
        @update:show-modal="val => state.preview.showModal = val"
      />
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #374151;
}

::-webkit-scrollbar-thumb {
  background: #6B7280;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

/* Smooth transitions */
* {
  transition: all 0.2s ease;
}

/* Loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>