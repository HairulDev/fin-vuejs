<script setup>
import { toRaw, unref, ref, onMounted, computed, watchEffect } from 'vue'

import { saveToLocalStorage, getFromLocalStorage } from '../utils/storageUtils'
import { usePortfolioStore } from '../stores/usePortfolioStore'
import * as portfolioService from '../services/portfolioService'
import * as stockService from '../services/stockService'
import * as noteService from '../services/noteService'

import SummarySection from '../components/SummarySection.vue'
import ModalStock from '../components/ModalStock.vue'
import CompanyComparison from '../components/CompanyComparisonSection.vue'
import PredictionTable from '../components/PredictionTable.vue'
import PortfolioSection from '../components/PortfolioSection.vue'
import ModalNotes from '../components/ModalNotes.vue'
import ModalPreview from '../components/ModalPreview.vue'
import { formatLargeMonetaryNumber, formatNumber, formatPercent, formatRatio } from '../utils/NumberFormatting'
import { formatDate } from '../utils/datetime'

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

// angular
const isModalOpen = ref(false)
const selectedItem = ref(null)
const fullReport = ref(null)
// end angular

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

watchEffect(() => {
  loadStocks()
})




// function migrasi angular => vue
function currency(v) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v ?? 0)
}


async function openDetailModal(item) {
  selectedItem.value = item
  isModalOpen.value = true
  const symbol = item.symbol
  const [metrics, profile, filings, income, cash, balance] = await Promise.all([
    portfolioService.getKeyMetricsTTM(symbol),
    portfolioService.getCompanyProfile(symbol),
    portfolioService.getSecFilings(symbol),
    portfolioService.getIncomeStatements(symbol),
    portfolioService.getCashFlowStatements(symbol),
    portfolioService.getBalanceSheetStatements(symbol)
  ])
  fullReport.value = {
    symbol,
    companyProfile: profile?.[0] || null,
    keyMetrics: metrics?.[0] || null,
    secFilings: filings || [],
    incomeStatements: income || [],
    cashFlows: cash || [],
    balanceSheet: balance?.[0] || null
  }
}

function closeModal() {
  isModalOpen.value = false
  selectedItem.value = null
}


function copyJSON() {
  const report = toRaw(unref(fullReport))
  if (!report) return
  const jsonString = JSON.stringify(report, null, 2)

  navigator.clipboard.writeText(jsonString)
    .then(() => {
      alert('Full report copied to clipboard!')
    })
    .catch(err => {
      console.error('Failed to copy: ', err)
    })
}

function downloadJSON() {
  const report = toRaw(unref(fullReport))
  if (!report) return

  const jsonString = JSON.stringify(report, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${report.symbol || 'report'}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}


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
      
      <!-- <div class="flex flex-col md:flex-row gap-4"> -->
        <CompanyComparison
          :items="state.comparison.items"
          :loading="state.comparison.loading"
          :error="state.comparison.error"
          class="flex-1"
        />

        <PredictionTable class="flex-1" />
      <!-- </div> -->

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
        @open-detail="openDetailModal"
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


      <!-- Modal -->
      <div
        v-if="isModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4"
      >
        <div class="bg-gray-800 border border-gray-700 rounded-xl w-full shadow-lg relative flex flex-col">
          <!-- Scrollable content -->
          <div class="p-6 overflow-y-auto" style="max-height: calc(90vh - 60px)">
            <!-- Symbol -->
            <!-- <h3 class="text-xl text-left font-semibold text-white mb-4">
              {{ item?.symbol }}
            </h3> -->

            <!-- Company Profile -->
            <div v-if="fullReport.companyProfile" class="mb-4 text-left">
              <div class="flex items-center gap-4">
                <img
                  :src="fullReport.companyProfile.image"
                  alt="Logo"
                  class="w-12 h-12 rounded bg-white p-1"
                />
                <div>
                  <div class="text-lg font-bold text-white">
                    {{ fullReport.companyProfile.companyName }}
                  </div>
                  <div class="text-gray-400 text-sm">
                    {{ fullReport.companyProfile.ceo }} - {{ fullReport.companyProfile.sector }}
                  </div>
                  <a
                    :href="fullReport.companyProfile.website"
                    target="_blank"
                    class="text-blue-400 text-sm underline"
                    >Website</a
                  >
                </div>
              </div>
            </div>

            <!-- Metrics -->
            <div v-if="fullReport.keyMetrics" class="mt-6 text-sm">
              <h4 class="text-white font-semibold mb-4 text-center">Metrics</h4>

              <div class="flex justify-center">
                <div class="grid grid-cols-6 gap-3 text-sm text-left text-gray-300 w-max">
                  <div>
                    PE Ratio:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.peRatioTTM) }}</span>
                  </div>
                  <div>
                    PB Ratio:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.pbRatioTTM) }}</span>
                  </div>
                  <div>
                    ROE:
                    <span class="text-green-400">{{ formatPercent(fullReport.keyMetrics.roeTTM) }}</span>
                  </div>
                  <div>
                    ROA:
                    <span class="text-green-400">{{ formatPercent(fullReport.keyMetrics.roaTTM) }}</span>
                  </div>
                  <div>
                    Debt / Equity:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.debtToEquityTTM) }}</span>
                  </div>
                  <div>
                    Current Ratio:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.currentRatioTTM) }}</span>
                  </div>
                  <div>
                    Operating Margin:
                    <span class="text-green-400">{{ formatPercent(fullReport.keyMetrics.operatingProfitMarginTTM) }}</span>
                  </div>
                  <div>
                    Net Profit Margin:
                    <span class="text-green-400">{{ formatPercent(fullReport.keyMetrics.netProfitMarginTTM) }}</span>
                  </div>
                  <div>
                    Gross Profit Margin:
                    <span class="text-green-400">{{ formatPercent(fullReport.keyMetrics.grossProfitMarginTTM) }}</span>
                  </div>
                  <div>
                    Dividend / Share:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.dividendPerShareTTM) }}</span>
                  </div>
                  <div>
                    FCF / Share:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.freeCashFlowPerShareTTM) }}</span>
                  </div>
                  <div>
                    Book Value / Share:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.bookValuePerShareTTM) }}</span>
                  </div>
                  <div>
                    Revenue / Share:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.revenuePerShareTTM) }}</span>
                  </div>
                  <div>
                    EPS (TTM):
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.epsTTM) }}</span>
                  </div>
                  <div>
                    EV / EBITDA:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.evToEbitdaTTM) }}</span>
                  </div>
                  <div>
                    Price / Sales:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.priceToSalesRatioTTM) }}</span>
                  </div>
                  <div>
                    Interest Coverage:
                    <span class="text-green-400">{{ formatNumber(fullReport.keyMetrics.interestCoverageTTM) }}</span>
                  </div>
                  <div>
                    Payout Ratio:
                    <span class="text-green-400">{{ formatPercent(fullReport.keyMetrics.payoutRatioTTM) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Balance Sheet -->
            <div v-if="fullReport.balanceSheet" class="mt-6 text-sm">
              <h4 class="text-white font-semibold mb-2 text-center mb-4">Balance Sheet (Latest FY)</h4>
                <div class="flex justify-center">
                    <div class="grid grid-cols-4 gap-2 text-sm text-left text-gray-300 w-max">
                        <!-- Assets -->
                        <div>Total Assets: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.totalAssets) }}</span></div>
                        <div>Cash & Equivalents: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.cashAndCashEquivalents) }}</span></div>
                        <div>Short-Term Investments: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.shortTermInvestments) }}</span></div>
                        <div>Net Receivables: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.netReceivables) }}</span></div>
                        <div>Inventory: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.inventory) }}</span></div>
                        <div>Other Current Assets: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.otherCurrentAssets) }}</span></div>
                        <div>Property, Plant & Equipment (Net): <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.propertyPlantEquipmentNet) }}</span></div>
                        <div>Goodwill: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.goodwill) }}</span></div>
                        <div>Intangible Assets: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.intangibleAssets) }}</span></div>
                        <div>Long-Term Investments: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.longTermInvestments) }}</span></div>
                        <div>Other Non-Current Assets: <span class="text-green-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.otherNonCurrentAssets) }}</span></div>

                        <!-- Liabilities -->
                        <div>Total Liabilities: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.totalLiabilities) }}</span></div>
                        <div>Short-Term Debt: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.shortTermDebt) }}</span></div>
                        <div>Account Payables: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.accountPayables) }}</span></div>
                        <div>Tax Payables: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.taxPayables) }}</span></div>
                        <div>Deferred Revenue: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.deferredRevenue) }}</span></div>
                        <div>Long-Term Debt: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.longTermDebt) }}</span></div>
                        <div>Deferred Tax Liabilities: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.deferredTaxLiabilitiesNonCurrent)}}</span>
                        </div>
                        <div>Capital Lease Obligations: <span class="text-red-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.capitalLeaseObligations) }}</span></div>

                        <!-- Equity -->
                        <div>Common Stock: <span class="text-blue-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.commonStock) }}</span></div>
                        <div>Retained Earnings: <span class="text-blue-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.retainedEarnings) }}</span></div>
                        <div>Equity (Total Stockholders'): <span class="text-blue-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.totalStockholdersEquity) }}</span></div>
                        <div>Accum. Other Comprehensive Income: <span class="text-blue-400">{{formatLargeMonetaryNumber(fullReport.balanceSheet.accumulatedOtherComprehensiveIncomeLoss)}}</span></div>
                    </div>
                </div>
            </div>

            <!-- Income Statements -->
            <h4 class="text-white font-semibold mt-6 text-center mb-2">Income Statement (Latest 2 FY):</h4>
            <div class="overflow-x-auto">
              <table class="min-w-full border border-gray-700 text-gray-300 text-sm">
                <thead class="bg-gray-700">
                  <tr>
                    <th class="p-2 text-left">Year</th>
                    <th class="p-2 text-right">Revenue</th>
                    <th class="p-2 text-right">Cost of Revenue</th>
                    <th class="p-2 text-right">Gross Profit</th>
                    <th class="p-2 text-right">Operating Expenses</th>
                    <th class="p-2 text-right">Operating Income</th>
                    <th class="p-2 text-right">EBITDA</th>
                    <th class="p-2 text-right">Interest Expense</th>
                    <th class="p-2 text-right">Income Before Tax</th>
                    <th class="p-2 text-right">Tax Expense</th>
                    <th class="p-2 text-right">Net Income</th>
                    <th class="p-2 text-right">EPS</th>
                    <th class="p-2 text-right">R&amp;D Expense</th>
                    <th class="p-2 text-right">Operating Margin</th>
                  </tr>
                </thead>

                <tbody>
                  <!-- ganti *ngFor dengan v-for -->
                  <tr v-for="stmt in fullReport.incomeStatements" :key="fullReport.incomeStatements.calendarYear">
                    <td class="p-2 text-left">{{ stmt.calendarYear }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.revenue) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.costOfRevenue) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.grossProfit) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.operatingExpenses) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.operatingIncome) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.ebitda) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.interestExpense) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.incomeBeforeTax) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.incomeTaxExpense) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.netIncome) }}</td>
                    <td class="p-2 text-right">{{ formatRatio(stmt.eps) }}</td>
                    <td class="p-2 text-right">{{ formatLargeMonetaryNumber(stmt.researchAndDevelopmentExpenses) }}</td>
                    <td class="p-2 text-right">{{ formatRatio(stmt.operatingIncomeRatio * 100) }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Cash Flow Statement -->
              <h4 class="text-white font-semibold mt-6 text-center mb-2">Cash Flow Statement (Latest 2 FY):</h4>
              <div class="overflow-x-auto">
                <table class="min-w-full border border-gray-700 text-gray-300 text-sm">
                  <thead class="bg-gray-700">
                    <tr>
                      <th class="p-2 text-left">Year</th>
                      <th class="p-2 text-right">Operating Cash Flow</th>
                      <th class="p-2 text-right">CapEx</th>
                      <th class="p-2 text-right">Free Cash Flow</th>
                      <th class="p-2 text-right">D&amp;A</th>
                      <th class="p-2 text-right">Net Borrowings</th>
                      <th class="p-2 text-right">Stock Buyback</th>
                      <th class="p-2 text-right">Stock Issuance</th>
                      <th class="p-2 text-right">Dividends Paid</th>
                      <th class="p-2 text-right">Net Change in Cash</th>
                      <th class="p-2 text-right">Cash at End</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cash in fullReport.cashFlows" :key="cash.calendarYear">
                      <td class="p-2 text-left">{{ cash.calendarYear }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.operatingCashFlow ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.capitalExpenditure ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.freeCashFlow ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.depreciationAndAmortization ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.netBorrowings ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.commonStockRepurchased ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.commonStockIssued ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.dividendsPaid ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.netChangeInCash ?? 0) }}</td>
                      <td class="p-2 text-right">{{ formatLargeMonetaryNumber(cash.cashAtEndOfPeriod ?? 0) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- secFilings -->
              <div v-if="fullReport.secFilings && fullReport.secFilings.length" class="text-sm mt-6">
                <h4 class="text-white font-semibold text-center mb-2">10-K Filings:</h4>
                <ul class="list-disc pl-4 text-blue-400 text-left">
                  <li v-for="filing in fullReport.secFilings" :key="filing.finalLink">
                    <a :href="filing.finalLink" target="_blank">
                      {{ formatDate(filing.fillingDate) }} - {{ filing.type }}
                    </a>
                  </li>
                </ul>
              </div>
            
          </div>

          <!-- Footer -->
          <div class="px-6 py-2 border-t border-gray-700 flex justify-end">
            <button
              @click="downloadJSON"
              class="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded-lg mr-2"
            >
              Download
            </button>
            <button
              @click="copyJSON"
              class="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded-lg mr-2"
            >
              Copy
            </button>
            <button
              @click="closeModal"
              class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded-lg"
            >
              Close
            </button>
          </div>

        </div>
      </div>
       <!-- end modal -->

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