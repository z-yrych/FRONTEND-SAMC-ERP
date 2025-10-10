import api from '../axios'

// API_BASE removed - using api instance baseURL

export interface WarehouseLocation {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateWarehouseLocationDto {
  name: string
}

export async function getWarehouseLocations(): Promise<WarehouseLocation[]> {
  const response = await api.get(`/warehouse-locations`)
  return response.data
}

export async function getActiveWarehouseLocations(): Promise<WarehouseLocation[]> {
  const response = await api.get(`/warehouse-locations/active`)
  return response.data
}

export async function createWarehouseLocation(data: CreateWarehouseLocationDto): Promise<WarehouseLocation> {
  const response = await api.post(`/warehouse-locations`, data)
  return response.data
}
