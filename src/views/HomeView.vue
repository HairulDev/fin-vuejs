<script setup>
import { reactive, ref, onMounted, computed, watchEffect } from 'vue'
import { useForm, } from 'vee-validate'
import * as yup from 'yup'
import axios from 'axios'
import { getCachedOrFetch } from '../utils/cacheUtils'
import { formatDate } from '../utils/datetime'

import SummarySection from '../components/SummarySection.vue'
import ModalStock from '../components/ModalStock.vue'
import PortfolioSection from '../components/PortfolioSection.vue'
import { Folder, FolderUp } from 'lucide-vue-next'

const token = localStorage.getItem('token')

// ====================== STATE MANAGEMENT ======================
const state = reactive({
  // Search Stocks
  search: reactive({
    query: '',
    results: [],
    loading: false,
    error: '',
    showSuggestions: false
  }),

  // Portfolio
  portfolio: reactive({
    dividends: {},
    items: [],
    error: '',
    loading: false
  }),

  // Notes
  notes: reactive({
    showModal: false,
    action: '',
    title: '',
    content: '',
    filePaths: [],
    selectedSymbol: '',
    isDescending: false,
    list: [],
    selectedFiles: [],
    isEditing: false,
    editingId: null
  }),

  // Stocks
  stocks: reactive({
    showModal: false,
    modalStep: 1,
    form: {
      symbol: '',
      companyName: '',
      purchase: '',
      lastDiv: '',
      industry: '',
      marketCap: ''
    },
    search: {
      symbol: '',
      companyName: '',
      sortBy: 'symbol',
      isDescending: false,
      pageNumber: 1,
      pageSize: 5
    },
    list: [],
    isEditing: false,
    editingId: null
  }),

  // File Preview
  preview: reactive({
    url: "",
    showModal: false
  }),

  // UI States
  ui: reactive({
    showSearchSection: false
  })
})

// ====================== VALIDATION SCHEMAS ======================
const stockSchema = yup.object({
  symbol: yup.string().required('Symbol is required'),
  companyName: yup.string().required('Company name is required'),
  purchase: yup.number().typeError('Must be a number').required('Purchase price is required'),
  lastDiv: yup.number().typeError('Must be a number').required('Last dividend is required'),
  industry: yup.string().required('Industry is required'),
  marketCap: yup.number().typeError('Must be a number').required('Market cap is required')
})

const { 
  handleSubmit: handleStockSubmit, 
  errors: stockErrors,
  resetForm: resetStockForm,
  setValues
} = useForm({
  validationSchema: stockSchema,
  initialValues: state.stocks.form
})

// ====================== COMPUTED PROPERTIES ======================
const totalValue = computed(() => {
  return state.portfolio.items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0
    return sum + price
  }, 0)
})

// Local storage functions
function saveTotalPortfolios(key, value, expiryInHours = 24) {
  const now = new Date()
  const item = {
    value: value,
    expiry: now.getTime() + expiryInHours * 60 * 60 * 1000,
  }
  localStorage.setItem(key, JSON.stringify(item))
}

function getTotalPortfolios(key) {
  const itemStr = localStorage.getItem(key)
  if (!itemStr) return null

  const item = JSON.parse(itemStr)
  const now = new Date()

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key)
    return null
  }
  return item.value
}

const STORAGE_KEY = "totalPortfolios"
const totalValueOld = ref(getTotalPortfolios(STORAGE_KEY) || totalValue.value)

const totalGain = computed(() => {
  if (totalValueOld.value === 0) return 0
  return Math.ceil(totalValue.value - totalValueOld.value)
})

watchEffect(() => {
  const savedTotalValue = getTotalPortfolios(STORAGE_KEY)
  if (!savedTotalValue) {
    saveTotalPortfolios(STORAGE_KEY, totalValue.value)
  }
})

// ====================== PORTFOLIO METHODS ======================
const searchStocks = async () => {
  if (!state.search.query) return

  state.search.loading = true
  state.search.error = ''
  state.search.results = []

  try {
    const data = await getCachedOrFetch(
      'searchCache',
      state.search.query,
      async () => {
        const response = await axios.get(
          `${import.meta.env.VITE_API_FMP}/api/v3/search?query=${state.search.query}&limit=10&exchange=NASDAQ&apikey=${import.meta.env.VITE_API_KEY}`
        )
        return response.data
      },
      5 * 60 * 60 * 1000 // 5 hours
    )

    state.search.results = data
    state.search.showSuggestions = true
  } catch (err) {
    state.search.error = err.response?.data?.message || 'An error occurred'
  } finally {
    state.search.loading = false
  }
}

const clearSearch = () => {
  state.search.query = ''
  state.search.showSuggestions = false
  state.search.results = []
}

const selectSuggestion = (item) => {
  state.search.query = `${item.name} (${item.symbol})`
  state.search.showSuggestions = false
  addToPortfolio(item.symbol)
}

const addToPortfolio = async (symbol) => {
  state.search.loading = true
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/portfolio/?symbol=${encodeURIComponent(symbol)}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert(`${symbol} added to portfolio successfully.`)
    await loadPortfolio()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to add to portfolio')
  } finally {
    state.search.loading = false
  }
}

const loadPortfolio = async () => {
  state.portfolio.loading = true
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    state.portfolio.items = response.data

    await Promise.all(
      state.portfolio.items.map(async (item) => {
        // Load dividend data
        try {
          const sortedData = await getCachedOrFetch(
            'dividendCache',
            item.symbol,
            async () => {
              const result = await axios.get(
                `${import.meta.env.VITE_API_FMP}/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(item.symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
              )
              return result.data.historical
                ?.slice(0, 18)
                ?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || []
            },
            5 * 60 * 60 * 1000
          )
          state.portfolio.dividends[item.symbol] = sortedData
        } catch (err) {
          state.portfolio.dividends[item.symbol] = []
        }

        // Load profile data
        try {
          const profileData = await getCachedOrFetch(
            'companyProfileCache',
            item.symbol,
            async () => {
              const profileRes = await axios.get(
                `${import.meta.env.VITE_API_FMP}/api/v3/profile/${encodeURIComponent(item.symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
              )
              return profileRes?.data?.[0] || {}
            },
            5 * 60 * 60 * 1000
          )
          item.price = profileData.price || '-'
        } catch (err) {
          console.error(`Failed to load profile for ${item.symbol}`)
        }
      })
    )
  } catch (err) {
    state.portfolio.error = err.response?.data?.message || 'Failed to load portfolio'
  } finally {
    state.portfolio.loading = false
  }
}

const deletePortfolio = async (symbol) => {
  if (!confirm('Are you sure you want to delete this portfolio?')) return
  state.portfolio.loading = true
  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/portfolio/?symbol=${encodeURIComponent(symbol)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await loadPortfolio()
  } catch (err) {
    state.portfolio.error = err.response?.data?.message || 'Failed to delete portfolio'
  } finally {
    state.portfolio.loading = false
  }
}

// ====================== STOCK METHODS ======================
const loadStocks = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/stock?` +
      `Symbol=${encodeURIComponent(state.stocks.search.symbol)}` +
      `&CompanyName=${encodeURIComponent(state.stocks.search.companyName)}` +
      `&SortBy=${encodeURIComponent(state.stocks.search.sortBy)}` +
      `&IsDescending=${state.stocks.search.isDescending}` +
      `&PageNumber=${state.stocks.search.pageNumber}` +
      `&PageSize=${state.stocks.search.pageSize}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    state.stocks.list = response.data || []
  } catch (err) {
    console.error("Failed to load stocks:", err.response?.data?.message || err.message)
    state.stocks.list = []
  }
}

const onSubmitStock = (e) => {
  e.preventDefault()
  if (state.stocks.isEditing) {
    updateStock(state.stocks.form)
  } else {
    saveStock(state.stocks.form)
  }
}

const saveStock = handleStockSubmit(async (values) => {
  state.portfolio.loading = true
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/stock`,
      values,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert('Stock saved successfully.')
    loadStocks()
    state.stocks.modalStep = 1
    resetStockForm()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save stock.')
  } finally {
    state.portfolio.loading = false
  }
})

const updateStock = handleStockSubmit(async (values) => {
  state.portfolio.loading = true
  try {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/stock/${state.stocks.editingId}`,
      values,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert('Stock updated successfully.')
    loadStocks()
    state.stocks.modalStep = 1
    resetStockForm()
    state.stocks.editingId = null
    state.stocks.isEditing = false
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to update stock.')
  } finally {
    state.portfolio.loading = false
  }
})

const startEditingStock = async (stockId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/stock/${stockId}`)
    const stock = response.data
    // Inject ke form
    setValues({
      symbol: stock.symbol ?? '',
      companyName: stock.companyName ?? '',
      purchase: stock.purchase ?? '',
      lastDiv: stock.lastDiv ?? '',
      industry: stock.industry ?? '',
      marketCap: stock.marketCap ?? ''
    })

    state.stocks.editingId = stockId
    state.stocks.isEditing = true
    state.stocks.modalStep = 2
  } catch (error) {
    console.error('Failed to fetch stock:', error)
    alert('Error fetching stock for editing.')
  }
}

const deleteStock = async (stockId) => {
  if (!confirm('Are you sure you want to delete this stock?')) return
  state.portfolio.loading = true
  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/stock/${stockId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    state.stocks.list = state.stocks.list.filter(item => item.id !== stockId)
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete stock.')
  } finally {
    state.portfolio.loading = false
  }
}

const nextPage = () => {
  state.stocks.search.pageNumber++
  loadStocks()
}

const prevPage = () => {
  if (state.stocks.search.pageNumber > 1) {
    state.stocks.search.pageNumber--
    loadStocks()
  }
}

// ====================== NOTES METHODS ======================
const loadNotes = async () => {
  if (!state.notes.selectedSymbol) return

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/comment?` +
      `Symbol=${encodeURIComponent(state.notes.selectedSymbol)}` +
      `&IsDecsending=${state.notes.isDescending}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    state.notes.list = response.data || []
  } catch (err) {
    console.error("Failed to load notes:", err.response?.data?.message || err.message)
    state.notes.list = []
  }
}

const openNotesModal = (symbol) => {
  state.notes.selectedSymbol = symbol
  state.notes.title = ''
  state.notes.content = ''
  state.notes.list = []
  loadNotes()
  state.notes.showModal = true
}

const startEditingNote = async (noteId, action) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`)
    const note = response.data

    state.notes.action = action
    state.notes.title = note.title
    state.notes.content = note.content
    state.notes.filePaths = note.filePaths || []
    state.notes.editingId = noteId
    state.notes.isEditing = true
    state.notes.showModal = true
  } catch (error) {
    console.error('Failed to fetch note:', error)
    alert('Error fetching note for editing.')
  }
}

const saveNote = async () => {
  state.portfolio.loading = true
  try {
    await uploadFile()
    
    const payload = {
      title: state.notes.title,
      content: state.notes.content,
      filePath: state.preview.url
    }

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/comment/${encodeURIComponent(state.notes.selectedSymbol)}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    alert("Note saved successfully.")
    loadNotes()
    resetNoteForm()
  } catch (err) {
    console.error("Error saving note:", err)
    alert(err.response?.data?.message || "Failed to save note.")
  } finally {
    state.portfolio.loading = false
  }
}

// BUG : edit (exist file) -> upload new file -> old file replaced 
const updateNote = async () => {
  state.portfolio.loading = true
  try {
    await uploadFile()

    const payload = {
      title: state.notes.title,
      content: state.notes.content,
      filePath: state.preview.url
    }

    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/comment/${state.notes.editingId}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    const index = state.notes.list.findIndex(n => n.id === state.notes.editingId)
    if (index !== -1) {
      state.notes.list[index].title = state.notes.title
      state.notes.list[index].content = state.notes.content
    }

    alert('Note updated successfully.')
    resetNoteForm()
  } catch (err) {
    console.error(err)
    alert('Error updating note.')
  } finally {
    state.portfolio.loading = false
  }
}

const deleteNote = async (noteId) => {
  if (!confirm('Are you sure you want to delete this note?')) return
  state.portfolio.loading = true
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`)
    state.notes.filePaths = data.filePaths || []

    if (state.notes.filePaths.length) {
      for (const file of state.notes.filePaths) {
        await deleteFile(file)
      }
    }

    await axios.delete(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`)
    state.notes.list = state.notes.list.filter(note => note.id !== noteId)
    resetNoteForm()
  } catch (error) {
    console.error(error)
    alert('Error deleting note.')
  } finally {
    state.portfolio.loading = false
  }
}

const resetNoteForm = () => {
  state.notes.title = ''
  state.notes.content = ''
  state.notes.filePaths = []
  state.notes.selectedFiles = []
  state.notes.isEditing = false
  state.notes.editingId = null
  state.notes.showModal = false
}

// ====================== FILE METHODS ======================
const handleFileChange = (event) => {
  state.notes.selectedFiles = Array.from(event.target.files)
}

const uploadFile = async () => {
  if (!state.notes.selectedFiles.length) return
  state.portfolio.loading = true
  
  const formData = new FormData()
  state.notes.selectedFiles.forEach(file => {
    formData.append("files[]", file)
  })

  try {
    const { data } = await axios.post("http://localhost:8080/upload", formData)
    state.preview.url = (data.files || []).join(",")
    state.notes.selectedFiles = []
  } catch (error) {
    console.error("Error uploading files:", error)
    alert("Error uploading files.")
  } finally {
    state.portfolio.loading = false
  }
}

const deleteFile = async (file) => {
  try {
    await axios.delete(`http://localhost:8080/delete/${file}`)
  } catch (error) {
    console.error("Error deleting file:", error)
    alert("Error deleting file.")
  }
}

const previewFile = (file) => {
  state.preview.url = `http://localhost:8080/download/${file}`
  state.preview.showModal = true
}

// ====================== UI METHODS ======================
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

// ====================== LIFECYCLE HOOKS ======================
onMounted(() => {
  loadPortfolio()
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