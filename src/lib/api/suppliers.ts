import api from '../axios'

// API_BASE removed - using api instance baseURL

export interface Supplier {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  reliabilityScore: number
  averageLeadTime: number
  isActive: boolean
  createdAt: string
}

export interface CreateSupplierDto {
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  reliabilityScore?: number
  averageLeadTime?: number
}

export interface UpdateSupplierDto {
  name?: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  reliabilityScore?: number
  averageLeadTime?: number
  isActive?: boolean
}

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await api.get(`/suppliers`)
  return response.data
}

export async function createSupplier(data: CreateSupplierDto): Promise<Supplier> {
  const response = await api.post(`/suppliers`, data)
  return response.data
}

export async function searchSuppliers(query: string): Promise<Supplier[]> {
  if (!query) return []
  const response = await api.get(`/suppliers/search?q=${query}`)
  return response.data
}

export async function getSupplier(id: string): Promise<Supplier> {
  const response = await api.get(`/suppliers/${id}`)
  return response.data
}

export async function updateSupplier(id: string, data: UpdateSupplierDto): Promise<Supplier> {
  const response = await api.put(`/suppliers/${id}`, data)
  return response.data
}

export async function deleteSupplier(id: string): Promise<void> {
  await api.delete(`/suppliers/${id}`)
}
