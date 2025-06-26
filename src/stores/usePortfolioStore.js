// src/stores/usePortfolioStore.js
import { reactive, computed, watchEffect } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'

export function usePortfolioStore() {
    const state = reactive({
        search: reactive({
            query: '',
            results: [],
            loading: false,
            error: '',
            showSuggestions: false
        }),
        portfolio: reactive({
            dividends: {},
            items: [],
            error: '',
            loading: false
        }),
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
        preview: reactive({
            url: "",
            showModal: false
        }),
        ui: reactive({
            showSearchSection: false
        })
    })

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

    const totalValue = computed(() => {
        return state.portfolio.items.reduce((sum, item) => {
            const price = parseFloat(item.price) || 0
            return sum + price
        }, 0)
    })

    return {
        state,
        stockErrors,
        handleStockSubmit,
        resetStockForm,
        setValues,
        totalValue
    }
}