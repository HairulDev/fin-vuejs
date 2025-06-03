<script setup>
import { ref, onMounted, computed, watchEffect } from 'vue';
import axios from 'axios';
import { getCachedOrFetch } from '../utils/cacheUtils';
import DividendChart from '../components/DividendChart.vue';
import {  TrendingUp, BadgePlus, Search, TrendingDown, Activity, Layers, FolderUp, Folder } from 'lucide-vue-next';
import { formatDate } from '../utils/datetime';
const token = localStorage.getItem('token');

// SEARCH STOCKS
const query = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const showSuggestions = ref(false);

// PORTFOLIO
const portfolioDividends = ref({});
const portfolios = ref([]);
const portfolioError = ref('');
const portfolioLoading = ref(false);
const showSearchSection = ref(false);

const showNotesModal = ref(false);
const noteAction = ref('');
const noteTitle = ref('');
const noteContent = ref('');
const noteFilePaths = ref([]);
const selectedSymbol = ref('');
const filePath = ref('');

const noteIsDescending = ref(false);

const notesList = ref([]);

const isEditing = ref(false);
const editingNoteId = ref(null);

const showStocksModal = ref(false);

const stockModalStep = ref(1); // 1 = List, 2 = Form

// form
const stockSymbol = ref('');
const stockCompanyName = ref('');
const stockPurchase = ref('');
const stockLastDiv = ref('');
const stockIndustry = ref('');
const stockmarketCap = ref('');

// parameter
const stockSearchSymbol = ref('');
const stockSearchCompanyName = ref('');
const stockSortBy = ref('symbol');
const stockIsDescending = ref(false);
const stockPageNumber = ref(1);
const stockPageSize = ref(5);

const stocksList = ref([]);

const isEditingStock = ref(false);
const editingStockId = ref(null);

const selectedFiles = ref([]);

const previewUrl = ref("");
const showPreviewModal = ref(false);

// PART portfolio
const searchStocks = async () => {
  if (!query.value) return;

  loading.value = true;
  error.value = '';
  results.value = [];

  try {
    const data = await getCachedOrFetch(
      'searchCache',
      query.value,
      async () => {
        const response = await axios.get(
          `${import.meta.env.VITE_API_FMP}/api/v3/search?query=${query.value}&limit=10&exchange=NASDAQ&apikey=${import.meta.env.VITE_API_KEY}`
        );
        return response.data;
      },
      5 * 60 * 60 * 1000 // 5 jam
    );

    results.value = data;
    showSuggestions.value = true;
  } catch (err) {
    error.value = err.response?.data?.message || 'Terjadi kesalahan';
  } finally {
    loading.value = false;
  }
};

const clearSearch = () => {
  query.value = '';
  showSuggestions.value = false;
  results.value = [];
};

const selectSuggestion = (item) => {
  query.value = `${item.name} (${item.symbol})`;
  showSuggestions.value = false;
  addToPortfolio(item.symbol);
};

const addToPortfolio = async (symbol) => {
  loading.value = true;
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/portfolio/?symbol=${encodeURIComponent(symbol)}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    loading.value = false;
    alert(`${symbol} berhasil ditambahkan ke portfolio.`);
    await loadPortfolio(); // Refresh portfolio list
  } catch (err) {
    loading.value = false;
    alert(err.response?.data?.message || 'Gagal menambahkan portfolio');
  }
};

const loadPortfolio = async () => {
  portfolioLoading.value = true;
  try {
    
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/portfolio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    portfolios.value = response.data;

    // --- Untuk setiap symbol ---
    await Promise.all(
      portfolios.value.map(async (item) => {
        // 1. Ambil data historical dividend (cache 5 jam)
        try {
          const sortedData = await getCachedOrFetch(
            'dividendCache',
            item.symbol,
            async () => {
              const result = await axios.get(
                `${import.meta.env.VITE_API_FMP}/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(item.symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
              );
              if (result?.data?.historical) {
                return result.data.historical
                  .slice(0, 18)
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              } else {
                return [];
              }
            },
            5 * 60 * 60 * 1000
          );
          portfolioDividends.value[item.symbol] = sortedData;
        } catch (err) {
          portfolioDividends.value[item.symbol] = [];
        }

        // 2. Ambil data profile (cache 5 jam)
        try {
          const profileData = await getCachedOrFetch(
            'companyProfileCache',
            item.symbol,
            async () => {
              const profileRes = await axios.get(
                `${import.meta.env.VITE_API_FMP}/api/v3/profile/${encodeURIComponent(item.symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
              );
              return profileRes?.data?.[0] || {}; // API profile biasanya array
            },
            5 * 60 * 60 * 1000
          );

          // Contoh: simpan ke item.price (atau item object) jika mau pakai di UI
          item.price = profileData.price || '-';
        } catch (err) {
          console.error(`Gagal ambil profile untuk ${item.symbol}`);
        }
      })
    );
  } catch (err) {
    portfolioError.value = err.response?.data?.message || 'Gagal mengambil portfolio';
  } finally {
    portfolioLoading.value = false;
  }
};

onMounted(() => { // Dipanggil sekali saja saat component sudah mounted
  loadPortfolio();
});

const deletePortfolio = async (symbol) => {
  if (!confirm('Are you sure you want to delete this portfolio?')) return;
  portfolioLoading.value = true;
  try {
    await axios.delete(`${import.meta.env.VITE_API_URL}/api/portfolio/?symbol=${encodeURIComponent(symbol)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await loadPortfolio();
  } catch (err) {
    portfolioError.value = err.response?.data?.message || 'Gagal menghapus portfolio';
  } finally {
    portfolioLoading.value = false;
  }
};

// Mock data for demo stats
const totalValue = computed(() => {
  return portfolios.value.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    return sum + price;
  }, 0);
});

// Fungsi untuk menyimpan ke localStorage dengan expired 24 jam
function saveTotalPortfolios(key, value, expiryInHours = 24) {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + expiryInHours * 60 * 60 * 1000,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

// Fungsi untuk mengambil dari localStorage jika belum expired
function getTotalPortfolios(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    // Data sudah expired, hapus dan kembalikan null
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}

// Key untuk localStorage
const STORAGE_KEY = "totalPortfolios";

// Mengecek dan menyimpan ulang jika expired
watchEffect(() => { // Kalau reactive data yang dipakai di dalam watchEffect berubah, maka isi watchEffect akan dieksekusi ulang.
  const savedTotalValue = getTotalPortfolios(STORAGE_KEY);

  if (!savedTotalValue) {
    saveTotalPortfolios(STORAGE_KEY, totalValue.value);
  }
});

// Hitung persentase totalGain terhadap totalValue lama
const totalValueOld = ref(getTotalPortfolios(STORAGE_KEY) || totalValue.value);

const totalGain = computed(() => {
  if (totalValueOld.value === 0) return 0;
  return Math.ceil(totalValue.value - totalValueOld.value);
});

// PART notes

const handleFileChange = (event) => {
      selectedFiles.value = Array.from(event.target.files);
};

const uploadFile = async () => {
  if (!selectedFiles.value.length) return;
  console.log("uploadFile called")
  loading.value = true;
  const formData = new FormData();
  selectedFiles.value.forEach((file) => {
    formData.append("files[]", file);
  });

  try {
    const { data } = await axios.post("http://localhost:8080/upload", formData);
    filePath.value = (data.files || []).join(",");
    selectedFiles.value = [];
  } catch (error) {
    console.error("Error uploading files:", error);
    alert("Error uploading files.");
  } finally {
    loading.value = false;
  }
};

const deleteFile = async (file) => {
  try {
    await axios.delete(`http://localhost:8080/delete/${file}`);
  } catch (error) {
    console.error("Error deleting files:", error);
    alert("Error deleting files.");
  } finally {
    loading.value = false;
  }
};

const previewFile = (file) => {
  previewUrl.value = `http://localhost:8080/download/${file}`;
  showPreviewModal.value = true;
};

const loadNotes = async () => {
  if (!selectedSymbol.value) return;

  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/comment?` +
      `Symbol=${encodeURIComponent(selectedSymbol.value)}` +
      `&IsDecsending=${noteIsDescending.value}`,
      {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    notesList.value = response.data || [];

  } catch (err) {
    console.error("Gagal memuat catatan:", err.response?.data?.message || err.message);
    notesList.value = [];
  }
};

const openNotesModal = (symbol) => {
  selectedSymbol.value = symbol;
  noteTitle.value = '';
  noteContent.value = '';
  notesList.value = [];
  loadNotes();
  showNotesModal.value = true;
};

const resetForm = () => {
  // part note
  noteAction.value = '';
  noteTitle.value = '';
  noteContent.value = '';
  noteFilePaths.value = [];
  selectedFiles.value = [];
  editingNoteId.value = null;
  isEditing.value = false;

  // part stock
  stockSymbol.value = '';
  stockCompanyName.value = '';
  stockPurchase.value = '';
  stockLastDiv.value = '';
  stockIndustry.value = '';
  stockmarketCap.value = '';

  isEditingStock.value = false;
  showStocksModal.value = false;
};

const startEditing = async (noteId, action) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`);
    const note = response.data;

    noteAction.value = action;
    noteTitle.value = note.title;
    noteContent.value = note.content;
    noteFilePaths.value = note.filePaths;
    editingNoteId.value = noteId;
    isEditing.value = true;
    showNotesModal.value = true;
  } catch (error) {
    console.error('Failed to fetch note:', error);
    alert('Error fetching note for editing.');
  }
};

const cancelNote = async () => {
  noteAction.value = '';
  showNotesModal.value = false;
  noteFilePaths.value = [];
  selectedFiles.value = [];
  isEditing.value = false;
;}

const delEditFile = async (file) => {
  if (!confirm('Are you sure you want to delete this file?')) return;
  loading.value = true;
  try {
    await deleteFile(file);
    noteFilePaths.value = noteFilePaths.value.filter(f => f !== file);

    const payload = {
        title: noteTitle.value,
        content: noteContent.value,
        filePath: (noteFilePaths.value || []).join(",")
      };

      await axios.put(`${import.meta.env.VITE_API_URL}/api/comment/${editingNoteId.value}`, payload);
      const index = notesList.value.findIndex(n => n.id === editingNoteId.value);
      if (index !== -1) {
        notesList.value[index].title = noteTitle.value;
        notesList.value[index].content = noteContent.value;
      }
    resetForm();
    alert('File deleted successfully.');
  } catch (error) {
    console.error("Error deleting file:", error);
    alert("Error deleting file.");
  } finally {
    loading.value = false;
  }
};

const updateNote = async () => {
  try {
    await uploadFile(); // upload

    let fileExist = '';
    if(noteFilePaths.value) {
      fileExist = (noteFilePaths.value || []).join(",");
    }
    console.log("fileExist===>>",fileExist)
    console.log("filePath.value===>>",filePath.value)
    if (fileExist) {
        filePath.value = fileExist + "," + filePath.value;
    }

      const payload = {
        title: noteTitle.value,
        content: noteContent.value,
        filePath: filePath.value,
      };

      console.log("payload====>>",payload)
      await axios.put(`${import.meta.env.VITE_API_URL}/api/comment/${editingNoteId.value}`, payload);
      // Update local list
      const index = notesList.value.findIndex(n => n.id === editingNoteId.value);
      if (index !== -1) {
        notesList.value[index].title = noteTitle.value;
        notesList.value[index].content = noteContent.value;
      }

      alert('Note updated successfully.');
      resetForm();
  } catch (error) {
    console.error(error);
    alert('Error updating note.');
  }
};

const saveNote = async () => {
  loading.value = true;

  try {
    await uploadFile(); // upload

    if(filePath.value) {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/comment/${encodeURIComponent(selectedSymbol.value)}`,
          {
            title: noteTitle.value,
            content: noteContent.value,
            filePath: filePath.value, // Hasil upload yang disimpan sebelumnya
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
      );
    }

    alert("Catatan berhasil disimpan.");
    loadNotes();
    resetForm();
  } catch (err) {
    console.error("Error saving note:", err);
    alert(err.response?.data?.message || "Gagal menyimpan catatan.");
  } finally {
    loading.value = false;
  }
};

const deleteNote = async (noteId) => {
  if (!confirm('Are you sure you want to delete this note?')) return;
  loading.value = true;
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`);
    noteFilePaths.value = data.filePaths;

    if (noteFilePaths.value.length) {
      for (const file of noteFilePaths.value) {
        await deleteFile(file);
      }
    }

    await axios.delete(`${import.meta.env.VITE_API_URL}/api/comment/${noteId}`);
    notesList.value = notesList.value.filter(note => note.id !== noteId);
    resetForm();
  } catch (error) {
    console.error(error);
    alert('Error deleting note.');
  } finally {
    loading.value = false;
  }
};

// PART stocks
const loadStocks = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/stock?` +
      `Symbol=${encodeURIComponent(stockSearchSymbol.value)}` +
      `&CompanyName=${encodeURIComponent(stockSearchCompanyName.value)}` +
      `&SortBy=${encodeURIComponent(stockSortBy.value)}` +
      `&IsDescending=${stockIsDescending.value}` +
      `&PageNumber=${stockPageNumber.value}` +
      `&PageSize=${stockPageSize.value}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    stocksList.value = response.data || [];
  } catch (err) {
    console.error("Gagal memuat stocks:", err.response?.data?.message || err.message);
    stocksList.value = [];
  }
};

const nextPage = () => {
  stockPageNumber.value++;
  loadStocks();
};

const prevPage = () => {
  if (stockPageNumber.value > 1) {
    stockPageNumber.value--;
    loadStocks();
  }
};

watchEffect(()=> {
  loadStocks();
})

const openStocksModal = () => {
  stockModalStep.value = 1;
  stockSymbol.value = '';
  stockCompanyName.value = '';
  stockPurchase.value = '';
  stockLastDiv.value = '';
  stockIndustry.value = '';
  stockmarketCap.value = '';
  stocksList.value = [];
  loadStocks();
  showStocksModal.value = true;
};

const backToStockList = () => {
  stockModalStep.value = 1;
  // resetForm();
};

const startEditingStock = async (stockId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/stock/${stockId}`);
    const stock = response.data;

    stockSymbol.value = stock.symbol;
    stockCompanyName.value = stock.companyName;
    stockPurchase.value = stock.purchase;
    stockLastDiv.value = stock.lastDiv;
    stockIndustry.value = stock.industry;
    stockmarketCap.value = stock.marketCap;
    editingStockId.value = stockId;
    isEditingStock.value = true;
    stockModalStep.value = 2; // Go to form step
  } catch (error) {
    console.error('Failed to fetch stock:', error);
    alert('Error fetching stock for editing.');
  }
};

const updateStock = async () => {
  try {
    const payload = {
      symbol: stockSymbol.value,
      companyName: stockCompanyName.value,
      purchase: stockPurchase.value,
      lastDiv: stockLastDiv.value,
      industry: stockIndustry.value,
      marketCap: stockmarketCap.value,
    };

    await axios.put(`${import.meta.env.VITE_API_URL}/api/stock/${editingStockId.value}`, payload);

    // Update local list
    const index = stocksList.value.findIndex(n => n.id === editingStockId.value);
    if (index !== -1) {
      stocksList.value[index].symbol = stockSymbol.value;
      stocksList.value[index].companyName = stockCompanyName.value;
      stocksList.value[index].purchase = stockPurchase.value;
      stocksList.value[index].lastDiv = stockLastDiv.value;
      stocksList.value[index].industry = stockIndustry.value;
      stocksList.value[index].marketCap = stockmarketCap.value;
    }
    alert('Stock updated successfully.');
    resetForm();
  } catch (error) {
    console.error(error);
    alert('Error updating stock.');
  }
};

const saveStock = async () => {
  loading.value = true;

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/stock`,
      {
        symbol: stockSymbol.value,
        companyName: stockCompanyName.value,
        purchase: stockPurchase.value,
        lastDiv: stockLastDiv.value,
        industry: stockIndustry.value,
        marketCap: stockmarketCap.value,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    loading.value = false;
    alert('Stock berhasil disimpan.');
    showNotesModal.value = false;
    loadStocks(); 
  } catch (err) {
    loading.value = false;
    alert(err.response?.data?.message || 'Gagal menyimpan stock.');
  }
};

const deleteStock = async (stockId) => {
  if (!confirm('Are you sure you want to delete this stock?')) return;

  loading.value = true;

  try {
    const response = await axios.delete(`${import.meta.env.VITE_API_URL}/api/stock/${stockId}`);
    stocksList.value = stocksList.value.filter(note => note.id !== stockId);
  } catch (error) {
    console.error(error);
    alert('Error deleting stock.');
  } finally {
    loading.value = false;
  }
};

const closeStock = () => {
  stockSearchSymbol.value = '';
  stockSearchCompanyName.value = '';
  stockSortBy.value = 'Symbol';
  stockIsDescending.value = false;
  stockPageNumber.value = 1;
  stockPageSize.value = 999;

  loadStocks();
  
  showStocksModal.value = false;
};

</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header Section -->
    <!-- <div class="border-b border-gray-700 bg-gray-800">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-bold text-white flex items-center gap-2">
              <ChartBar class="w-6 h-6" />
              Stock Portfolio Hairul
            </h1>            <div class="hidden md:flex items-center space-x-6 text-sm">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                <span class="text-gray-300">Live Data</span>
              </div>
              <div class="text-gray-400">Last updated: {{ new Date().toLocaleTimeString() }}</div>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button class="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div> -->

    <div class="px-6 py-6">
      <!-- Summary Section -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
        <div class="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <!-- Total Portfolio -->
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
            <TrendingUp 
              v-if="totalGain >= 0" 
              class="w-3 h-3 text-green-400" 
            />
            <TrendingDown 
              v-else 
              class="w-3 h-3 text-red-400" 
            />
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
              <p class="text-2xl font-bold text-white">{{ portfolios.length }}</p>
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
                <button @click="openStocksModal(1)" class="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">Show</button>
              </p>
                <p class="text-2xl font-bold text-white">{{ stocksList.length }}</p>
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

      <!-- Portfolio Section -->
      <button @click="showSearchSection = !showSearchSection" class="px-3 py-1 mb-2 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center gap-2">
      <BadgePlus class="w-4 h-4" />Portfolio
      </button>

      <!-- Modal Search -->
      <div
        v-if="showSearchSection"
        class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
      >
        <div class="bg-gray-800 rounded-lg p-6 h-[500px] w-full max-w-md border border-gray-600 flex flex-col">
          <h2 class="text-lg font-semibold mb-4 text-gray-200">Add Stock to Portfolio</h2>
          
          <!-- Part input + search -->
          <div class="flex flex-col md:flex-row gap-3 relative">
            <div class="relative flex-1">
              <input
                v-model="query"
                @input="showSuggestions = true"
                type="text"
                placeholder="Search stocks (e.g., AAPL, MSFT, GOOGL)..."
                class="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 w-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              />
              <button
                v-if="query"
                @click="clearSearch"
                class="absolute inset-y-0 right-3 text-gray-400 hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
            <button
              @click="searchStocks"
              :disabled="loading"
              class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              <Search class="w-5 h-5" />
            </button>

            <!-- Autocomplete suggestions -->
            <div
              v-if="showSuggestions && results.length"
              class="absolute z-20 top-full left-0 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto mt-1"
            >
              <div
                v-for="item in results"
                :key="item.symbol"
                @click="selectSuggestion(item)"
                class="px-4 py-3 cursor-pointer hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
              >
                <div class="font-medium text-white">{{ item.name }}</div>
                <div class="text-sm text-gray-400">{{ item.symbol }} • {{ item.exchangeShortName }}</div>
              </div>
            </div>
          </div>

          <!-- Error -->
          <p v-if="error" class="text-red-400 mt-3 text-sm">{{ error }}</p>

          <!-- Buttons (Cancel di bawah) -->
          <div class="mt-auto pt-4">
            <button
              @click="showSearchSection = false"
              class="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Your Portfolio Section -->
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="px-6 py-2 border-b border-gray-700">
          <h2 class="text-xl font-semibold text-white">Your Portfolio</h2>
        </div>

        <div class="p-6">
          <div v-if="portfolioLoading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            <p class="text-gray-400 mt-2">Loading portfolio...</p>
          </div>

          <p v-else-if="portfolioError" class="text-red-400 text-center py-8">{{ portfolioError }}</p>

          <div v-else-if="portfolios.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div
              v-for="(item, index) in portfolios"
              :key="index"
              class="bg-gray-800 rounded-lg p-5 border border-gray-600 hover:border-gray-500 transition-all duration-200 hover:shadow-lg"
            >
              <!-- Stock Header -->
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h3 class="font-bold text-lg text-blue-400">{{ item.symbol }}</h3>
                  <p class="text-2xl font-bold text-white mt-1">${{ item.price }}</p>
                </div>
                <button 
                  @click="deletePortfolio(item.symbol)" 
                  class="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-gray-600"
                  title="Remove from portfolio"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              <!-- Dividend Chart -->
              <div class="mt-4">
                <div v-if="portfolioDividends[item.symbol]?.length" class="h-32 mb-3">
                  <DividendChart :data="portfolioDividends[item.symbol]" />
                </div>
                <div v-else class="h-32 flex items-center justify-center bg-gray-800 rounded border border-gray-600 mb-3">
                  <p class="text-gray-500 text-sm">No dividend data available</p>
                </div>
                
                <!-- Chart Label -->
                <div class="flex items-center justify-between text-xs text-gray-400 gap-2">
                  <span v-if="portfolioDividends[item.symbol]?.length">
                    Dividend History {{ portfolioDividends[item.symbol].length }} records
                  </span>
                  <button
                    @click="openNotesModal(item.symbol)"
                    class="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    Notes
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12">
            <div class="text-gray-500 mb-4">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <p class="text-lg font-medium">No stocks in portfolio</p>
              <p class="text-sm">Search and add stocks to get started</p>
            </div>
          </div>

          <!-- Modal Notes -->
          <div
            v-if="showNotesModal"
            class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
          >
            <div class="bg-gray-800 rounded-lg p-6 w-full max-w-xl border border-gray-600">
              <!-- List Notes -->
              <h3 class="text-lg font-semibold text-white mb-4">
                Notes for {{ selectedSymbol }}
              </h3>
              <div class="mb-4 max-h-60 overflow-y-auto">

              <div class="mb-2">
                <label class="block text-sm text-gray-400 mb-1">Order</label>
                <select
                  v-model="noteIsDescending"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                  @change="loadNotes"
                >
                  <option :value="false">Ascending</option>
                  <option :value="true">Descending</option>
                </select>
              </div>
              
                <ul v-if="notesList.length" class="space-y-2">
                  <li
                    v-for="note in notesList"
                    :key="note.id"
                    class="bg-gray-700 p-3 rounded flex justify-between items-start gap-2"
                  >
                    <div>
                        <p class="font-bold text-white">{{ note.title }}</p>
                        <p class="text-gray-300 text-sm">{{ note.content }}</p>
                        <p class="text-[10px] text-gray-400 mt-2">{{ formatDate(note.createdOn) }}</p>
                      </div>
                    <div class="flex gap-2">
                      <button @click="startEditing(note.id, 'view')" class="text-gray-400 hover:text-gray-300 text-sm">View</button>
                      <button @click="startEditing(note.id, 'edit')" class="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                      <button @click="deleteNote(note.id)" class="text-red-400 hover:text-red-300 text-sm">Delete</button>
                    </div>
                    </li>
                  </ul>
                <p v-else class="text-gray-400 text-sm">No notes found for this stock.</p>
              </div>
              <!-- Add Note Form -->
              <h3 class="text-lg font-semibold text-white mb-2">
                {{ noteAction === 'view' ? 'View' : (isEditing ? 'Edit' : 'Add') }} Note
              </h3>
              <div class="flex flex-col gap-3">
                <input
                  v-model="noteTitle"
                  type="text"
                  placeholder="Title"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none"
                />
                <textarea
                  v-model="noteContent"
                  placeholder="Notes"
                  rows="4"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 focus:outline-none resize-none"
                ></textarea>
              </div>

              <div class="flex flex-col gap-3 mt-3">
                <!-- Input File -->
                <label class="text-gray-400 text-sm">{{noteAction === 'view' ? 'Uploaded' : 'Upload'}} File</label>
                <label
                  v-if="noteAction !== 'view'"
                  for="fileInput"
                  class="flex items-center cursor-pointer bg-gray-700 text-gray-200 px-4 py-2 rounded border border-gray-600 hover:bg-gray-600 transition-colors"
                >
                  <FolderUp class="w-5 h-5 mr-2" /> Choose Files {{ selectedFiles.length ? `(${selectedFiles.length})` : '' }}
                </label>

                <!-- Input file disembunyikan -->
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  @change="handleFileChange"
                  class="hidden"
                />

                <!-- Tampilkan nama file yang dipilih -->
                <!-- <div v-if="selectedFiles.length" class="text-sm text-gray-300 mt-2">
                  <p>Selected Files:</p>
                  <ul class="list-disc pl-4">
                    <li v-for="file in selectedFiles" :key="file.name">{{ file.name }}</li>
                  </ul>
                </div> -->
                
                <div v-if="noteFilePaths.length" class="text-sm text-gray-200 space-y-2">
                  <div class="font-semibold mb-1">Files:</div>
                  <ul class="pl-4 space-y-1">
                    <li
                      v-for="(file, index) in noteFilePaths"
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
                        v-if="noteAction === 'edit'"
                        @click.stop="delEditFile(file)"
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
                  @click="cancelNote"
                  class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="isEditing ? updateNote() : saveNote()"
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                >
                  {{ isEditing ? 'Update' : 'Save' }}
                </button>

              </div>
            </div>
          </div>

        </div>
      </div>

        <!-- Modal Preview -->
        <div
          v-if="showPreviewModal"
          class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
        >
          <div class="bg-white rounded-lg overflow-hidden max-w-4xl w-full max-h-[90vh]">
            <div class="flex justify-between items-center p-2 bg-gray-800 text-white">
              <h3 class="text-sm font-semibold">File Preview</h3>
              <button @click="showPreviewModal = false" class="text-white text-xl">&times;</button>
            </div>
            <div class="p-2">
              <iframe
                :src="previewUrl"
                class="w-full h-[80vh]"
                frameborder="0"
              ></iframe>
            </div>
          </div>
        </div>

      <!-- Modal Stock -->
      <div
        v-if="showStocksModal"
        class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
      >
        <div class="bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-600">
          <!-- Step Indicator -->
          <div class="flex mb-6">
            <div 
              class="flex-1 text-center pb-2 border-b-2"
              :class="stockModalStep === 1 ? 'border-blue-500 text-blue-500' : 'border-gray-600 text-gray-400'"
            >
              Stock List
            </div>
            <div 
              class="flex-1 text-center pb-2 border-b-2"
              :class="stockModalStep === 2 ? 'border-blue-500 text-blue-500' : 'border-gray-600 text-gray-400'"
            >
              {{ isEditingStock ? 'Edit' : 'Add' }} Stock
            </div>
          </div>

          <!-- Step 1: Stock List -->
          <div v-if="stockModalStep === 1">
            <!-- Search and Filter Section -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1">Symbol</label>
                <input
                  v-model="stockSearchSymbol"
                  type="text"
                  placeholder="Filter by symbol"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                  @input="loadStocks"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">Company Name</label>
                <input
                  v-model="stockSearchCompanyName"
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
                  v-model="stockSortBy"
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
                  v-model="stockIsDescending"
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
                  v-model="stockPageSize"
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
                @click="stockModalStep = 2" 
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

            <!-- Pagination -->
            <div class="flex items-center justify-between mt-4">
              <button
                @click="prevPage"
                :disabled="stockPageNumber === 1"
                class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Previous
              </button>
              <span class="text-sm text-gray-300">Page {{ stockPageNumber }}</span>
              <button
                @click="nextPage"
                :disabled="stocksList.length < stockPageSize"
                class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Next
              </button>
            </div>

            <!-- Close Button -->
            <div class="flex justify-end mt-6">
              <button
                @click="closeStock"
                class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          <!-- Step 2: Stock Form -->
          <div v-if="stockModalStep === 2">
            <h3 class="text-lg font-semibold text-white mb-4">
              {{ isEditingStock ? 'Edit Stock' : 'Add New Stock' }}
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm text-gray-400 mb-1">Symbol</label>
                <input
                  v-model="stockSymbol"
                  type="text"
                  placeholder="Symbol"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">Company Name</label>
                <input
                  v-model="stockCompanyName"
                  type="text"
                  placeholder="Company Name"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">Purchase Price</label>
                <input
                  v-model="stockPurchase"
                  type="number"
                  placeholder="Purchase"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">Last Dividend</label>
                <input
                  v-model="stockLastDiv"
                  type="number"
                  placeholder="Last Div"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">Industry</label>
                <input
                  v-model="stockIndustry"
                  type="text"
                  placeholder="Industry"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-400 mb-1">Market Cap</label>
                <input
                  v-model="stockmarketCap"
                  type="number"
                  placeholder="Market Cap"
                  class="bg-gray-700 text-white border border-gray-600 rounded px-4 py-2 w-full focus:outline-none"
                />
              </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-between mt-6">
              <button
                @click="backToStockList"
                class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Back to List
              </button>
              <div class="flex gap-2">
                <button
                  @click="resetForm"
                  class="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                >
                  Reset
                </button>
                <button
                  @click="isEditingStock ? updateStock() : saveStock()"
                  class="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                >
                  {{ loading ? 'Saving...' : isEditingStock ? 'Update' : 'Save' }}
                </button>
              </div>
            </div>
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