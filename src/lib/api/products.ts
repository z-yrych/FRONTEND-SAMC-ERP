import api from '../axios'
import type { Supplier } from './suppliers'

// API_BASE removed - using api instance baseURL

export interface Product {
  id: string
  name: string
  description?: string
  sku?: string
  unit?: string
  manufacturer?: string
  barcode?: string
  currentStock?: number
  isActive: boolean
  category: 'consumable' | 'non_consumable'
  stockType: 'stocked' | 'non_stocked'
  alertStockLevel?: number | null
  suppliers?: Supplier[]
  createdAt: string
  updatedAt: string
  stockLevel?: {
    onHand: number
    allocated: number
    available: number
  }
}

export interface CreateProductDto {
  name: string
  description?: string
  sku?: string
  unit?: string
  manufacturer?: string
  isActive?: boolean
  category?: 'consumable' | 'non_consumable'
  stockType?: 'stocked' | 'non_stocked'
  alertStockLevel?: number
  supplierIds?: string[]
}

export interface UpdateProductDto {
  name?: string
  description?: string
  sku?: string
  unit?: string
  manufacturer?: string
  isActive?: boolean
  category?: 'consumable' | 'non_consumable'
  stockType?: 'stocked' | 'non_stocked'
  alertStockLevel?: number
  supplierIds?: string[]
}

export async function getProducts(): Promise<Product[]> {
  const response = await api.get(`/products`)
  return response.data
}

export async function getProductsWithStock(): Promise<Product[]> {
  const response = await api.get(`/products/with-stock`)
  return response.data
}

export async function getProduct(id: string): Promise<Product> {
  const response = await api.get(`/products/${id}`)
  return response.data
}

export async function createProduct(data: CreateProductDto): Promise<Product> {
  const response = await api.post(`/products`, data)
  return response.data
}

export async function updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
  const response = await api.put(`/products/${id}`, data)
  return response.data
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}

export async function scanProductBySKU(sku: string) {
  const response = await api.get(`/products/scan/${sku}`)
  return response.data
}

export async function fetchLowStockProducts(): Promise<Product[]> {
  const response = await api.get(`/products/low-stock`)
  return response.data
}

export async function fetchProductsMissingAlertLevels(): Promise<Product[]> {
  const response = await api.get(`/products/missing-alert-levels`)
  return response.data
}

export interface PackagingLevel {
  name: string
  contains?: number
  level: number
}

export interface PackagingStructure {
  id: string
  name: string
  levels: Record<string, PackagingLevel>
  primarySupplier?: string
  createdAt: string
}

export async function getPackagingStructures(productId: string): Promise<PackagingStructure[]> {
  const response = await api.get(`/inventory/products/${productId}/packaging-structures`)
  return response.data
}
