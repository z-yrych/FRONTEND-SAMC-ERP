import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWarehouseLocations,
  getActiveWarehouseLocations,
  createWarehouseLocation,
  type CreateWarehouseLocationDto,
  type WarehouseLocation
} from '../lib/api/warehouseLocations'

export function useWarehouseLocations() {
  return useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: getWarehouseLocations
  })
}

export function useActiveWarehouseLocations() {
  return useQuery({
    queryKey: ['warehouse-locations', 'active'],
    queryFn: getActiveWarehouseLocations
  })
}

export function useCreateWarehouseLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateWarehouseLocationDto) => createWarehouseLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse-locations'] })
    }
  })
}
