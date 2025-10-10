import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Search, Eye, RefreshCw } from 'lucide-react'
import { ActionCard } from './ActionCard'
import { ProductFormModal } from '../products/ProductFormModal'
import { ProductsManagementModal } from '../masterdata/ProductsManagementModal'
import { RestockModal } from '../inventory/RestockModal'
import { StartStockCountModal } from '../inventory/StartStockCountModal'
import { RestockingMethodModal } from '../restocking-rfq/RestockingMethodModal'
import { RestockingRFQModal } from '../restocking-rfq/RestockingRFQModal'
import { createProduct, type CreateProductDto } from '../../lib/api/products'

export function InventorySection() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false)
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false)
  const [isRestockingMethodModalOpen, setIsRestockingMethodModalOpen] = useState(false)
  const [isRFQModalOpen, setIsRFQModalOpen] = useState(false)
  const [isStockCountModalOpen, setIsStockCountModalOpen] = useState(false)

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsAddProductModalOpen(false)
      console.log('Product created successfully!')
    },
    onError: (error: any) => {
      console.error('Failed to create product:', error)
      alert('Failed to create product. Please try again.')
    },
  })

  const handleAddProduct = () => {
    setIsAddProductModalOpen(true)
  }

  const handleStockCount = () => {
    setIsStockCountModalOpen(true)
  }

  const handleCheckProducts = () => {
    navigate('/barcode-scanner')
  }

  const handleViewProducts = () => {
    setIsProductsModalOpen(true)
  }

  const handleRestockProducts = () => {
    setIsRestockingMethodModalOpen(true)
  }

  const handleMethodSelection = (method: 'direct_po' | 'rfq') => {
    if (method === 'direct_po') {
      setIsRestockModalOpen(true)
    } else if (method === 'rfq') {
      setIsRFQModalOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your product catalog and inventory levels
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Row 1 */}
        <ActionCard
          icon={Package}
          title="Add Product"
          description="Add new products to your catalog"
          onClick={handleAddProduct}
        />

        <ActionCard
          icon={RefreshCw}
          title="Restock Product"
          description="Create purchase orders and restock inventory"
          onClick={handleRestockProducts}
        />

        {/* Row 2 */}
        <ActionCard
          icon={Search}
          title="Check Product/s"
          description="Scan barcode to check product details and stock"
          onClick={handleCheckProducts}
        />

        <ActionCard
          icon={Eye}
          title="View Product/s"
          description="Browse and manage all products in inventory"
          onClick={handleViewProducts}
        />

      </div>

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
        <ProductFormModal
          product={null}
          onClose={() => setIsAddProductModalOpen(false)}
          onSubmit={(data) => createProductMutation.mutate(data as CreateProductDto)}
          isSubmitting={createProductMutation.isPending}
        />
      )}

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockModalOpen}
        onClose={() => setIsRestockModalOpen(false)}
        onSuccess={() => {
          console.log('Purchase Order created successfully!')
          // TODO: Optionally show PO in dashboard
        }}
      />

      {/* Start Stock Count Modal */}
      <StartStockCountModal
        isOpen={isStockCountModalOpen}
        onClose={() => setIsStockCountModalOpen(false)}
      />

      {/* Restocking Method Choice Modal */}
      <RestockingMethodModal
        isOpen={isRestockingMethodModalOpen}
        onClose={() => setIsRestockingMethodModalOpen(false)}
        onSelectMethod={handleMethodSelection}
      />

      {/* Restocking RFQ Modal */}
      <RestockingRFQModal
        isOpen={isRFQModalOpen}
        onClose={() => setIsRFQModalOpen(false)}
        onSuccess={() => {
          console.log('RFQ created and sent successfully!')
          // TODO: Optionally show RFQ in dashboard
        }}
      />

      {/* Products Management Modal */}
      <ProductsManagementModal
        isOpen={isProductsModalOpen}
        onClose={() => setIsProductsModalOpen(false)}
      />
    </div>
  )
}
