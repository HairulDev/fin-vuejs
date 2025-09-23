import axios from 'axios'
import { getCachedOrFetch } from '../utils/cacheUtils'

export async function searchStocks(state, query) {
    if (!query) return

    state.search.loading = true
    state.search.error = ''
    state.search.results = []

    try {
        const data = await getCachedOrFetch(
            'searchCache',
            query,
            async () => {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_FMP}/api/v3/search?query=${query}&limit=100&apikey=${import.meta.env.VITE_API_KEY}`
                )
                return response.data
            },
            5 * 60 * 60 * 1000
        )

        state.search.results = data
        state.search.showSuggestions = true
    } catch (err) {
        state.search.error = err.response?.data?.message || 'An error occurred'
    } finally {
        state.search.loading = false
    }
}

export async function loadPortfolioComparison(state, token) {
    try {
        state.comparison.loading = true

        // --- ambil daftar symbol portfolio ---
        const portfolioRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/portfolio`,
            { headers: { Authorization: `Bearer ${token}` } }
        )

        const symbols = portfolioRes.data.map(item => item.symbol).join(',')
        if (!symbols) return

        const compareData = await getCachedOrFetch(
            'portfolioComparisonCache',
            symbols,
            async () => {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_PYTHON_URL}/compare?symbols=${symbols}`
                )
                return res.data
            },
            60 * 60 * 1000
        )

        state.comparison.items = compareData
    } catch (err) {
        state.comparison.error.value = err.message || 'Gagal memuat perbandingan'
    } finally {
        state.comparison.loading = false
    }
}

export async function loadPortfolio(state, token) {
    state.portfolio.loading = true
    try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/portfolio`, {
            headers: { Authorization: `Bearer ${token}` },
        })
        state.portfolio.items = response.data

        await Promise.all(
            state.portfolio.items.map(async (item) => {
                try {
                    const sortedData = await getCachedOrFetch(
                        'dividendCache',
                        item.symbol,
                        async () => {
                            const result = await axios.get(
                                `https://financialmodelingprep.com/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(item.symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
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

                try {
                    const profileData = await getCachedOrFetch(
                        'companyProfileCache',
                        item.symbol,
                        async () => {
                            const profileRes = await axios.get(
                                `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(item.symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
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

export async function addToPortfolio(state, token, symbol) {
    state.search.loading = true
    try {
        await axios.post(
            `${import.meta.env.VITE_API_URL}/api/portfolio/?symbol=${encodeURIComponent(symbol)}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        )
        alert(`${symbol} added to portfolio successfully.`)
        await loadPortfolio(state, token)
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to add to portfolio')
    } finally {
        state.search.loading = false
    }
}

export async function deletePortfolio(state, token, symbol) {
    if (!confirm('Are you sure you want to delete this portfolio?')) return
    state.portfolio.loading = true
    try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/portfolio/?symbol=${encodeURIComponent(symbol)}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        await loadPortfolio(state, token)
    } catch (err) {
        state.portfolio.error = err.response?.data?.message || 'Failed to delete portfolio'
    } finally {
        state.portfolio.loading = false
    }
}

export async function getDividends(symbol) {
    return getCachedOrFetch(
        'dividendCache',
        symbol,
        async () => {
            const url = `${import.meta.env.VITE_API_FMP}/api/v3/historical-price-full/stock_dividend/${encodeURIComponent(symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
            try {
                const { data } = await axios.get(url)
                return (
                    data?.historical
                        ?.slice(0, 18)
                        ?.sort((a, b) => new Date(a.date) - new Date(b.date)) || []
                )
            } catch {
                return []
            }
        },
        6 * 60 * 60 * 1000
    )
}

export async function getProfile(symbol) {
    return getCachedOrFetch(
        'companyProfileCache',
        symbol,
        async () => {
            const { data } = await axios.get(
                `${import.meta.env.VITE_API_FMP}/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${import.meta.env.VITE_API_KEY}`
            )
            return data?.[0] || {}
        },
        6 * 60 * 60 * 1000
    )
}

export async function getKeyMetricsTTM(symbol) {
    return await getCachedOrFetch('keyMetricsCache', symbol, async () => {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API_FMP}/api/v3/key-metrics-ttm/${encodeURIComponent(symbol)}?limit=1&apikey=${import.meta.env.VITE_API_KEY}`
        )
        return data
    })
};

export async function getCompanyProfile(symbol) {
    return await getCachedOrFetch('companyProfileArrayCache', symbol, async () => {
        const { data } = await axios.get(`${import.meta.env.VITE_API_FMP}/api/v3/profile/${encodeURIComponent(symbol)}?apikey=${import.meta.env.VITE_API_KEY}`)
        return data
    })
};

export async function getSecFilings(symbol) {
    return await getCachedOrFetch('secFilingsCache', symbol, async () => {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API_FMP}/api/v3/sec_filings/${encodeURIComponent(symbol)}?type=10-K&page=0&apikey=${import.meta.env.VITE_API_KEY}`
        )
        return data
    })
};

export async function getIncomeStatements(symbol) {
    return await getCachedOrFetch('incomeStatementsCache', symbol, async () => {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API_FMP}/api/v3/income-statement/${encodeURIComponent(symbol)}?limit=2&apikey=${import.meta.env.VITE_API_KEY}`
        )
        return data
    })
};

export async function getCashFlowStatements(symbol) {
    return await getCachedOrFetch('cashFlowStatementsCache', symbol, async () => {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API_FMP}/api/v3/cash-flow-statement/${encodeURIComponent(symbol)}?limit=2&apikey=${import.meta.env.VITE_API_KEY}`
        )
        return data
    })
};

export async function getBalanceSheetStatements(symbol) {
    return await getCachedOrFetch('balanceSheetStatementsCache', symbol, async () => {
        const { data } = await axios.get(
            `${import.meta.env.VITE_API_FMP}/api/v3/balance-sheet-statement/${encodeURIComponent(symbol)}?limit=1&apikey=${import.meta.env.VITE_API_KEY}`
        )
        return data
    })
}

