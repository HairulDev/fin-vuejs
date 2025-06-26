import axios from 'axios'

export async function loadStocks(state, token) {
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

export async function saveStock(state, token, values) {
    state.portfolio.loading = true
    try {
        await axios.post(
            `${import.meta.env.VITE_API_URL}/api/stock`,
            values,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        alert('Stock saved successfully.')
        await loadStocks(state, token)
        state.stocks.modalStep = 1
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to save stock.')
    } finally {
        state.portfolio.loading = false
    }
}

export async function updateStock(state, token, values) {
    state.portfolio.loading = true
    try {
        await axios.put(
            `${import.meta.env.VITE_API_URL}/api/stock/${state.stocks.editingId}`,
            values,
            { headers: { Authorization: `Bearer ${token}` } }
        )
        alert('Stock updated successfully.')
        await loadStocks(state, token)
        state.stocks.modalStep = 1
        state.stocks.editingId = null
        state.stocks.isEditing = false
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to update stock.')
    } finally {
        state.portfolio.loading = false
    }
}

export async function startEditingStock(state, token, stockId) {
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/stock/${stockId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        const stock = response.data

        state.stocks.form = {
            symbol: stock.symbol ?? '',
            companyName: stock.companyName ?? '',
            purchase: stock.purchase ?? '',
            lastDiv: stock.lastDiv ?? '',
            industry: stock.industry ?? '',
            marketCap: stock.marketCap ?? ''
        }

        state.stocks.editingId = stockId
        state.stocks.isEditing = true
        state.stocks.modalStep = 2
    } catch (error) {
        console.error('Failed to fetch stock:', error)
        alert('Error fetching stock for editing.')
    }
}

export async function deleteStock(state, token, stockId) {
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