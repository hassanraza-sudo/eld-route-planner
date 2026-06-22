import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export const planTrip = async (payload) => {
  const response = await api.post('/api/trip/plan/', payload)
  return response.data
}

export default api
