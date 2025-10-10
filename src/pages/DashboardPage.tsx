import { useState } from 'react'
import { InventorySection } from '../components/dashboard/InventorySection'
import { StockCountSection } from '../components/dashboard/StockCountSection'
import { TransactionOverview } from '../components/dashboard/TransactionOverview'
import { ClientsManagementModal } from '../components/masterdata/ClientsManagementModal'
import { ProductsManagementModal } from '../components/masterdata/ProductsManagementModal'
import { SuppliersManagementModal } from '../components/masterdata/SuppliersManagementModal'
import { ActionItemsTodoList } from '../components/dashboard/ActionItemsTodoList'
import { Users, Package, Building2 } from 'lucide-react'

export function DashboardPage() {
  const [showClientsModal, setShowClientsModal] = useState(false)
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [showSuppliersModal, setShowSuppliersModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome to your inventory management system
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Action Items TODO List */}
        <ActionItemsTodoList />

        <div className="border-t border-gray-300 pt-8"></div>

        {/* Master Data Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Master Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Clients Button */}
            <button
              onClick={() => setShowClientsModal(true)}
              className="flex items-center gap-3 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clients</h3>
                <p className="text-sm text-gray-600">Manage your clients</p>
              </div>
            </button>

            {/* Products Button */}
            <button
              onClick={() => setShowProductsModal(true)}
              className="flex items-center gap-3 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-shrink-0">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                <p className="text-sm text-gray-600">Manage your products</p>
              </div>
            </button>

            {/* Suppliers Button */}
            <button
              onClick={() => setShowSuppliersModal(true)}
              className="flex items-center gap-3 p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-shrink-0">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
                <p className="text-sm text-gray-600">Manage your suppliers</p>
              </div>
            </button>
          </div>
        </div>

        {/* Inventory Section */}
        <InventorySection />

        {/* Stock Count Management Section */}
        <StockCountSection />

        {/* Transaction Overview */}
        <TransactionOverview />

        {/* Placeholder for future sections */}
        {/* <SalesSection /> */}
        {/* <ReportsSection /> */}
      </div>

      {/* Modals */}
      <ClientsManagementModal
        isOpen={showClientsModal}
        onClose={() => setShowClientsModal(false)}
      />
      <ProductsManagementModal
        isOpen={showProductsModal}
        onClose={() => setShowProductsModal(false)}
      />
      <SuppliersManagementModal
        isOpen={showSuppliersModal}
        onClose={() => setShowSuppliersModal(false)}
      />
    </div>
  )
}
