import axios from "axios"
import { getCachedOrFetch } from "../utils/cacheUtils"


export const getPredictions = async (symbols) => {
  const queryKey = symbols.join(',')

  return getCachedOrFetch(
    'predictionsCache',
    queryKey,
    async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_PYTHON_URL}/predict-lstm-multi?symbols=${queryKey}`
        )
        return data
      } catch (error) {
        console.error('Error fetching predictions:', error)
        throw error
      }
    },
    60 * 60 * 1000          // cache 1 jam (ubah sesuai kebutuhan)
  )
}