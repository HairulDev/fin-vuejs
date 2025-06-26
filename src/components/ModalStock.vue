<script setup>
import { Field, ErrorMessage } from 'vee-validate'

const props = defineProps({
  showModal: Boolean,
  modalStep: Number,
  isEditing: Boolean,
  loading: Boolean,
  search: Object,
  stocksList: Array,
  form: Object,
  editingId: [Number, String],
  errors: Object
})

const emit = defineEmits([
  'update:modalStep',
  'update:isEditing',
  'update:search',
  'update:form',
  'update:editingId',
  'close',
  'loadStocks',
  'startEditingStock',
  'deleteStock',
  'prevPage',
  'nextPage',
  'backToStockList',
  'resetForm',
  'onSubmitStock'
])

const closeModal = () => {
  emit('close')
}

const startEditingStock = (id) => {
  emit('startEditingStock', id)
}

const deleteStock = (id) => {
  emit('deleteStock', id)
}

const prevPage = () => {
  emit('prevPage')
}

const nextPage = () => {
  emit('nextPage')
}

const backToStockList = () => {
  emit('backToStockList')
}

const resetForm = () => {
  emit('resetForm')
}

const onSubmitStock = (e) => {
  emit('onSubmitStock', e)
}

const loadStocks = () => {
  emit('loadStocks')
}
</script>

<template>
  <div
    v-if="showModal"
    class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
  >
    <div class="bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-600">
      <!-- Step Indicator -->
      <div class="flex mb-6">
        <div 
          class="flex-1 text-center pb-2 border-b-2"
          :class="modalStep === 1 ? 'border-blue-500 text-blue-500' : 'border-gray-600 text-gray-400'"
        >
          Stock List
        </div>
        <div 
          class="flex-1 text-center pb-2 border-b-2"
          :class="modalStep === 2 ? 'border-blue-500 text-blue-500' : 'border-gray-600 text-gray-400'"
        >
          {{ isEditing ? 'Edit' : 'Add' }} Stock
        </div>
      </div>

      <!-- Step 1: Stock List -->
      <div v-if="modalStep === 1">
        <!-- Search and Filter Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Symbol</label>
            <input
              v-model="search.symbol"
              type="text"
              placeholder="Filter by symbol"
              class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              @input="loadStocks"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Company Name</label>
            <input
              v-model="search.companyName"
              type="text"
              placeholder="Filter by company name"
              class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              @input="loadStocks"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Sort By</label>
            <select
              v-model="search.sortBy"
              class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              @change="loadStocks"
            >
              <option value="symbol">Symbol</option>
              <option value="companyName">Company Name</option>
              <option value="purchase">Purchase Price</option>
              <option value="lastDiv">Last Dividend</option>
              <option value="marketCap">Market Cap</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Order</label>
            <select
              v-model="search.isDescending"
              class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              @change="loadStocks"
            >
              <option :value="false">Ascending</option>
              <option :value="true">Descending</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Items Per Page</label>
            <select
              v-model="search.pageSize"
              class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              @change="loadStocks"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        <!-- List Stocks -->
        <h3 class="text-lg font-semibold text-white mb-4">
          Stocks List
          <button 
            @click="emit('update:modalStep', 2)" 
            class="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
          >
            Add New Stock
          </button>

        </h3>
        <div class="mb-4 max-h-96 overflow-y-auto">
          <table class="min-w-full divide-y divide-gray-700">
            <thead class="bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Symbol</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Company</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Purchase</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Div</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-gray-800 divide-y divide-gray-700">
              <tr v-for="stock in stocksList" :key="stock.id">
                <td class="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{{ stock.symbol }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{{ stock.companyName }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300">${{ stock.purchase }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300">${{ stock.lastDiv }}</td>
                <td class="px-4 py-2 whitespace-nowrap text-sm text-gray-300">
                  <button @click="startEditingStock(stock.id)" class="text-blue-400 hover:text-blue-300 mr-2">Edit</button>
                  <button @click="deleteStock(stock.id)" class="text-red-400 hover:text-red-300">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-if="!stocksList.length" class="text-gray-400 text-sm text-center py-4">No stocks found.</p>
        </div>

        <div class="flex items-center justify-between mt-4">
          <button
            @click="prevPage"
            :disabled="search.pageNumber === 1"
            class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <span class="text-sm text-gray-300">Page {{ search.pageNumber }}</span>
          <button
            @click="nextPage"
            :disabled="stocksList.length < search.pageSize"
            class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div class="flex justify-end mt-6">
          <button
            @click="closeModal"
            class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <!-- Step 2: Stock Form -->
      <div v-if="modalStep === 2">
        <h3 class="text-lg font-semibold text-white mb-4">
          {{ isEditing ? 'Edit Stock' : 'Add New Stock' }}
        </h3>
        
        <form @submit.prevent="onSubmitStock">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-gray-400 mb-1">Symbol</label>
              <Field
                name="symbol"
                type="text"
                placeholder="Symbol"
                class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              />
              <ErrorMessage name="symbol" v-slot="{ message }">
                <p class="text-red-500 text-xs mt-1">{{ message }}</p>
              </ErrorMessage>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Company Name</label>
              <Field
                name="companyName"
                type="text"
                placeholder="Company Name"
                class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              />
              <ErrorMessage name="companyName" v-slot="{ message }">
                <p class="text-red-500 text-xs mt-1">{{ message }}</p>
              </ErrorMessage>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Purchase Price</label>
              <Field
                name="purchase"
                type="number"
                placeholder="Purchase"
                class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              />
              <ErrorMessage name="purchase" v-slot="{ message }">
                <p class="text-red-500 text-xs mt-1">{{ message }}</p>
              </ErrorMessage>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Last Dividend</label>
              <Field
                name="lastDiv"
                type="number"
                placeholder="Last Div"
                class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              />
              <ErrorMessage name="lastDiv" v-slot="{ message }">
                <p class="text-red-500 text-xs mt-1">{{ message }}</p>
              </ErrorMessage>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Industry</label>
              <Field
                name="industry"
                type="text"
                placeholder="Industry"
                class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              />
              <ErrorMessage name="industry" v-slot="{ message }">
                <p class="text-red-500 text-xs mt-1">{{ message }}</p>
              </ErrorMessage>
            </div>
            <div>
              <label class="block text-sm text-gray-400 mb-1">Market Cap</label>
              <Field
                name="marketCap"
                type="number"
                placeholder="Market Cap"
                class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
              />
              <ErrorMessage name="marketCap" v-slot="{ message }">
                <p class="text-red-500 text-xs mt-1">{{ message }}</p>
              </ErrorMessage>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex justify-between mt-6">
            <button
              type="button"
              @click="backToStockList"
              class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Back to List
            </button>
            <div class="flex gap-2">
              <button
                type="button"
                @click="resetForm"
                class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                :disabled="loading"
                class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors disabled:opacity-50"
              >
                {{ loading ? 'Saving...' : isEditing ? 'Update' : 'Save' }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>