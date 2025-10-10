import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Create axios instance with ngrok bypass header
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page for API requests
  },
})

export default api
export { API_BASE }
