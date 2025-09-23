<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import { getPredictions } from '../services/predictionService'
import { formatToTwoDecimalPlaces } from '../utils/NumberFormatting'

const predictions = ref([])
const loading = ref(true)
const error = ref(null)
const file = ref(null)
const uploadStatus = ref('')

// === State untuk Training Popup ===
const showTrainingModal = ref(false)
const trainingLogs = ref('')
const training = ref(false)

// === State untuk Refresh ===
const refreshing = ref(false)

// === Ref untuk auto scroll training logs ===
const trainingLogsContainer = ref(null)

// === Scroll to bottom function ===
const scrollToBottom = () => {
  nextTick(() => {
    if (trainingLogsContainer.value) {
      trainingLogsContainer.value.scrollTop = trainingLogsContainer.value.scrollHeight
    }
  })
}

// === Watch training logs for auto scroll ===
watch(trainingLogs, () => {
  scrollToBottom()
}, { flush: 'post' })

const symbols = ['AAPL', 'MSFT', 'GOOGL']

const handleFileChange = (e) => {
  file.value = e.target.files[0]
  uploadStatus.value = ''
}

const uploadFile = async () => {
  if (!file.value) {
    uploadStatus.value = 'Please select a file first.'
    setTimeout(() => (uploadStatus.value = ''), 3000)
    return
  }

  const formData = new FormData()
  formData.append('file', file.value)

  try {
    uploadStatus.value = 'Uploading...'
    const response = await axios.post(
      `${import.meta.env.VITE_API_PYTHON_URL}/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )

    setTimeout(() => {
      uploadStatus.value = response.data.message
      setTimeout(() => {
        uploadStatus.value = ''
      }, 3000)
    }, 1000)
  } catch (err) {
    console.error('Upload error:', err)
    uploadStatus.value = 'Upload failed.'
    setTimeout(() => (uploadStatus.value = ''), 3000)
  }
}

// === Trigger Training LSTM ===
const startTraining = async () => {
  showTrainingModal.value = true
  training.value = true
  trainingLogs.value = ''

  try {
    const resp = await fetch(`${import.meta.env.VITE_API_PYTHON_URL}/train-lstm`, {
      method: 'POST'
    })

    if (!resp.ok) throw new Error('Failed to start training')

    const reader = resp.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      trainingLogs.value += decoder.decode(value, { stream: true })
    }
  } catch (err) {
    trainingLogs.value += `\n[Error] ${err.message}`
  } finally {
    training.value = false
  }
}

// === Refresh Predictions ===
const refreshPredictions = async () => {
  refreshing.value = true
  error.value = null
  
  try {
    const data = await getPredictions(symbols)
    predictions.value = data.results
    
    // Show success message briefly
    uploadStatus.value = 'Predictions refreshed successfully!'
    setTimeout(() => {
      uploadStatus.value = ''
    }, 3000)
    
  } catch (err) {
    error.value = 'Error refreshing predictions'
    console.error(err)
  } finally {
    refreshing.value = false
  }
}

onMounted(async () => {
  try {
    const data = await getPredictions(symbols)
    predictions.value = data.results
  } catch (err) {
    error.value = 'Error fetching predictions'
    console.error(err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="my-8">
    <div class="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-2xl overflow-hidden backdrop-blur-sm">
      <!-- Header dengan Glassmorphism Effect -->
      <div class="px-8 py-6 bg-gradient-to-r from-blue-900/30 to-purple-900/30 backdrop-blur-md border-b border-gray-700/50">
        <div class="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <!-- Title Section -->
          <div class="flex items-center space-x-3">
            <div class="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-white">AI Stock Predictions</h2>
              <p class="text-gray-400 text-sm">Machine Learning Powered Analytics</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <!-- File Upload Section -->
            <div class="relative group">
              <input
                type="file"
                @change="handleFileChange"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="file-input"
              />
              <label
                for="file-input"
                class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 
                       hover:from-slate-500 hover:to-slate-600 text-white font-medium rounded-xl 
                       transition-all duration-300 transform hover:scale-105 hover:shadow-lg cursor-pointer
                       border border-gray-600 hover:border-gray-500"
              >
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                {{ file ? file.name.slice(0, 20) + (file.name.length > 20 ? '...' : '') : 'Choose Dataset' }}
              </label>
            </div>

            <!-- Upload Button -->
            <button
              @click="uploadFile"
              :disabled="!file"
              class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                     hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700
                     text-white font-medium rounded-xl transition-all duration-300 
                     transform hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none
                     shadow-md hover:shadow-blue-500/25"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4"/>
              </svg>
              Upload Data
            </button>

            <!-- Training Button -->
            <button
              @click="startTraining"
              :disabled="training"
              class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 
                     hover:from-emerald-500 hover:to-green-600 disabled:from-gray-600 disabled:to-gray-700
                     text-white font-medium rounded-xl transition-all duration-300 
                     transform hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none
                     shadow-md hover:shadow-emerald-500/25"
            >
              <svg v-if="!training" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              <div v-else class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              {{ training ? 'Training...' : 'Train Model' }}
            </button>

            <!-- Refresh Predictions Button -->
            <button
              @click="refreshPredictions"
              :disabled="refreshing"
              class="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 
                     hover:from-purple-500 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700
                     text-white font-medium rounded-xl transition-all duration-300 
                     transform hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:transform-none
                     shadow-md hover:shadow-purple-500/25"
            >
              <svg v-if="!refreshing" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              <div v-else class="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
              {{ refreshing ? 'Refreshing...' : 'Refresh Data' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Status Messages -->
      <div
        v-if="uploadStatus"
        class="px-8 py-4 border-b border-gray-700/50"
      >
        <div
          class="flex items-center p-4 rounded-xl text-sm font-medium"
          :class="{
            'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30': uploadStatus.includes('successful') || uploadStatus.includes('refreshed'),
            'bg-red-900/30 text-red-400 border border-red-500/30': uploadStatus.includes('failed'),
            'bg-blue-900/30 text-blue-400 border border-blue-500/30': uploadStatus.includes('Uploading')
          }"
        >
          <svg v-if="uploadStatus.includes('successful') || uploadStatus.includes('refreshed')" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <svg v-else-if="uploadStatus.includes('failed')" class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
          <div v-else class="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2"></div>
          {{ uploadStatus }}
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <div class="relative mb-6">
          <div class="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <div class="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
        </div>
        <h3 class="text-white text-xl font-semibold mb-2">Loading Predictions</h3>
        <p class="text-gray-400">AI models are analyzing market data...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8">
        <div class="flex items-center justify-center p-8 bg-red-900/20 border border-red-500/30 rounded-xl">
          <svg class="w-8 h-8 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>
            <h3 class="text-red-400 font-semibold text-lg">Error Loading Predictions</h3>
            <p class="text-red-300">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Predictions Table -->
      <div v-else-if="predictions.length" class="p-6">
        <div class="overflow-x-auto">
          <div class="bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <table class="w-full">
              <thead>
                <tr class="bg-gradient-to-r from-gray-800 to-gray-700">
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex items-center space-x-2">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span>Symbol</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex flex-col items-center space-y-1">
                      <span>Next Day</span>
                      <span class="text-xs text-gray-500 font-normal">24h Prediction</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider border-r border-gray-600/50">
                    <div class="flex flex-col items-center space-y-1">
                      <span>30 Days</span>
                      <span class="text-xs text-gray-500 font-normal">Monthly Outlook</span>
                    </div>
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-300 uppercase tracking-wider">
                    <div class="flex flex-col items-center space-y-1">
                      <span>Long Term</span>
                      <span class="text-xs text-gray-500 font-normal">3600 Days</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-700/50">
                <tr 
                  v-for="(row, index) in predictions" 
                  :key="row.symbol" 
                  class="group hover:bg-gray-800/50 transition-all duration-200"
                  :class="index % 2 === 0 ? 'bg-gray-900/30' : 'bg-gray-800/20'"
                >
                  <!-- Symbol -->
                  <td class="px-6 py-4 border-r border-gray-700/30">
                    <div class="flex items-center space-x-3">
                      <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                        <span class="text-white font-bold text-lg">{{ row.symbol.charAt(0) }}</span>
                      </div>
                      <div>
                        <span class="text-white font-bold text-xl">{{ row.symbol }}</span>
                        <div class="w-0 group-hover:w-12 h-0.5 bg-blue-500 transition-all duration-300 mt-1"></div>
                      </div>
                    </div>
                  </td>

                  <!-- Tomorrow Prediction -->
                  <td class="px-6 py-4 text-center border-r border-gray-700/30">
                    <div class="flex flex-col items-center space-y-1">
                      <span class="text-2xl font-bold text-green-400">
                        ${{ formatToTwoDecimalPlaces(row.tommorow_prediction) }}
                      </span>
                      <div class="flex items-center text-xs text-gray-400">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                        <span>AI Forecast</span>
                      </div>
                    </div>
                  </td>

                  <!-- 30 Days Prediction -->
                  <td class="px-6 py-4 text-center border-r border-gray-700/30">
                    <div class="flex flex-col items-center space-y-1">
                      <span class="text-2xl font-bold text-gray-500">
                        -
                      </span>
                      <div class="text-xs text-gray-500">
                        Coming Soon
                      </div>
                    </div>
                  </td>

                  <!-- 3600 Days Prediction -->
                  <td class="px-6 py-4 text-center">
                    <div class="flex flex-col items-center space-y-1">
                      <span class="text-2xl font-bold text-gray-500">
                        -
                      </span>
                      <div class="text-xs text-gray-500">
                        Coming Soon
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Prediction Summary Cards -->
        <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-6 border border-blue-700/30">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-blue-500/20 rounded-lg">
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <span class="text-blue-400 text-sm font-medium">Active Predictions</span>
            </div>
            <p class="text-white text-3xl font-bold">{{ predictions.length }}</p>
            <p class="text-blue-300 text-sm mt-1">Stocks being tracked</p>
          </div>

          <div class="bg-gradient-to-br from-green-900/30 to-emerald-800/30 rounded-xl p-6 border border-green-700/30">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-green-500/20 rounded-lg">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <span class="text-green-400 text-sm font-medium">Model Accuracy</span>
            </div>
            <p class="text-white text-3xl font-bold">85%</p>
            <p class="text-green-300 text-sm mt-1">Historical performance</p>
          </div>

          <div class="bg-gradient-to-br from-purple-900/30 to-indigo-800/30 rounded-xl p-6 border border-purple-700/30">
            <div class="flex items-center justify-between mb-3">
              <div class="p-2 bg-purple-500/20 rounded-lg">
                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <span class="text-purple-400 text-sm font-medium">Last Updated</span>
            </div>
            <p class="text-white text-3xl font-bold">Now</p>
            <p class="text-purple-300 text-sm mt-1">Real-time data</p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <div class="mb-6">
          <svg class="w-20 h-20 text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <h3 class="text-gray-400 text-xl font-medium mb-2">No Predictions Available</h3>
        <p class="text-gray-500">Upload a dataset and train the model to see predictions</p>
      </div>
    </div>

    <!-- Modal Training -->
    <div
      v-if="showTrainingModal"
      class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div class="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        <!-- Modal Header -->
        <div class="flex justify-between items-center p-6 border-b border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="p-2 bg-green-500/20 rounded-lg">
              <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">Training Neural Network</h3>
              <p class="text-gray-400 text-sm">Real-time training logs and progress</p>
            </div>
          </div>
          <button
            class="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
            @click="showTrainingModal = false"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Training Logs -->
        <div class="flex-1 p-6">
          <div class="bg-black/50 border border-gray-700 rounded-xl overflow-hidden h-full min-h-[400px] relative">
            <div class="absolute top-3 right-3 flex items-center space-x-2 z-10 bg-black/70 px-2 py-1 rounded">
              <div v-if="training" class="flex items-center text-green-400 text-sm">
                <div class="animate-pulse w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span>Training Active</span>
              </div>
              <div v-else class="flex items-center text-gray-400 text-sm">
                <div class="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                <span>Training Complete</span>
              </div>
            </div>
            <div 
              ref="trainingLogsContainer"
              class="h-[600px] overflow-y-auto p-4 pt-12"
              style="scroll-behavior: smooth;"
            >
              <pre class="text-green-400 text-sm font-mono whitespace-pre-wrap">{{ trainingLogs || 'Initializing training process...\nWaiting for server response...' }}</pre>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end items-center p-6 border-t border-gray-700 space-x-3">
          <button
            class="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-colors"
            :disabled="training"
            @click="showTrainingModal = false"
          >
            {{ training ? 'Training in Progress...' : 'Close' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>