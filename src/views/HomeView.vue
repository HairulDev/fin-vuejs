<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue'

import { saveToLocalStorage, getFromLocalStorage } from '../utils/storageUtils'
import { usePortfolioStore } from '../stores/usePortfolioStore'
import * as portfolioService from '../services/portfolioService'
import * as stockService from '../services/stockService'
import * as noteService from '../services/noteService'
import { formatDate } from '../utils/datetime'

import SummarySection from '../components/SummarySection.vue'
import ModalStock from '../components/ModalStock.vue'
import PortfolioSection from '../components/PortfolioSection.vue'
import { Folder, FolderUp } from 'lucide-vue-next'


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
console.log("state===>>",state.value)
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
const handleFileChange = (event) => { state.notes.selectedFiles = Array.from(event.target.files)}
const previewFile = (file) => {
  state.preview.url = `http://localhost:8080/download/${file}`
  state.preview.showModal = true
}

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
})

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
      <div
        v-if="state.notes.showModal"
        class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
      >
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-xl border border-gray-600">
          <!-- List Notes -->
          <h3 class="text-lg font-semibold text-white mb-4">
            Notes for {{ state.notes.selectedSymbol }}
          </h3>
          <div class="mb-4 max-h-60 overflow-y-auto">
            <div class="mb-2">
              <label class="block text-sm text-gray-400 mb-1">Order</label>
              <select
                v-model="state.notes.isDescending"
                class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                @change="loadNotes"
              >
                <option :value="false">Ascending</option>
                <option :value="true">Descending</option>
              </select>
            </div>
            
            <ul v-if="state.notes.list.length" class="space-y-2">
              <li
                v-for="note in state.notes.list"
                :key="note.id"
                class="bg-gray-700 p-3 rounded flex justify-between items-start gap-2"
              >
                <div>
                  <p class="font-bold text-white">{{ note.title }}</p>
                  <p class="text-gray-300 text-sm">{{ note.content }}</p>
                  <p class="text-[10px] text-gray-400 mt-2">{{ formatDate(note.createdOn) }}</p>
                </div>
                <div class="flex gap-2">
                  <button @click="startEditingNote(note.id, 'view')" class="text-gray-400 hover:text-gray-300 text-sm">View</button>
                  <button @click="startEditingNote(note.id, 'edit')" class="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                  <button @click="deleteNote(note.id)" class="text-red-400 hover:text-red-300 text-sm">Delete</button>
                </div>
              </li>
            </ul>
            <p v-else class="text-gray-400 text-sm">No notes found for this stock.</p>
          </div>
          
          <!-- Add Note Form -->
          <h3 class="text-lg font-semibold text-white mb-2">
            {{ state.notes.action === 'view' ? 'View' : (state.notes.isEditing ? 'Edit' : 'Add') }} Note
          </h3>
          <div class="flex flex-col gap-3">
            <input
              v-model="state.notes.title"
              type="text"
              placeholder="Title"
              class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none"
              :readonly="state.notes.action === 'view'"
            />
            <textarea
              v-model="state.notes.content"
              placeholder="Notes"
              rows="4"
              class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none resize-none"
              :readonly="state.notes.action === 'view'"
            ></textarea>
          </div>

          <div class="flex flex-col gap-3 mt-3">
            <!-- Input File -->
            <label class="text-gray-400 text-sm">{{state.notes.action === 'view' ? 'Uploaded' : 'Upload'}} File</label>
            <label
              v-if="state.notes.action !== 'view'"
              for="fileInput"
              class="flex items-center cursor-pointer bg-gray-700 text-gray-200 px-4 py-2 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
            >
              <FolderUp class="w-5 h-5 mr-2" /> Choose Files {{ state.notes.selectedFiles.length ? `(${state.notes.selectedFiles.length})` : '' }}
            </label>

            <!-- Input file hidden -->
            <input
              id="fileInput"
              type="file"
              multiple
              @change="handleFileChange"
              class="hidden"
              :disabled="state.notes.action === 'view'"
            />

            <!-- Display selected files -->
            <div v-if="state.notes.filePaths.length" class="text-sm text-gray-200 space-y-2">
              <div class="font-semibold mb-1">Files:</div>
              <ul class="pl-4 space-y-1">
                <li
                  v-for="(file, index) in state.notes.filePaths"
                  :key="file"
                  class="flex items-center justify-between group"
                >
                  <div
                    @click="previewFile(file)"
                    class="flex cursor-pointer text-blue-400 underline hover:text-blue-300 transition"
                  >
                    <Folder class="w-5 h-5 mr-2" /> File ke-{{ index + 1 }}
                  </div>
                  <button
                    v-if="state.notes.action === 'edit'"
                    @click.stop="deleteFile(file)"
                    class="text-red-400 text-xs opacity-0 group-hover:opacity-100 hover:text-red-300 transition"
                  >
                    Delete
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-end gap-2 mt-4">
            <button
              @click="resetNoteForm"
              class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              v-if="state.notes.action !== 'view'"
              @click="state.notes.isEditing ? updateNote() : saveNote()"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
            >
              {{ state.notes.isEditing ? 'Update' : 'Save' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Preview -->
      <div
        v-if="state.preview.showModal"
        class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh]">
          <div class="flex justify-between items-center p-2 bg-gray-800 text-white">
            <h3 class="text-sm font-semibold">File Preview</h3>
            <button @click="state.preview.showModal = false" class="text-white text-xl">&times;</button>
          </div>
          <div class="p-2">
            <iframe
              :src="state.preview.url"
              class="w-full h-[80vh]"
              frameborder="0"
            ></iframe>
          </div>
        </div>
      </div>


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