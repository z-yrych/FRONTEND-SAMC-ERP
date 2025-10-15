import { useState } from 'react'
import { InventorySection } from '../components/dashboard/InventorySection'
import { StockCountSection } from '../components/dashboard/StockCountSection'
import { TransactionOverview } from '../components/dashboard/TransactionOverview'
import { SalesMetricsSection } from '../components/dashboard/SalesMetricsSection'
import { TopClientsSection } from '../components/dashboard/TopClientsSection'
import { TopProductsSection } from '../components/dashboard/TopProductsSection'
import { FinancialMetricsSection } from '../components/dashboard/FinancialMetricsSection'
import { CollapsibleSection } from '../components/dashboard/CollapsibleSection'
import { PeriodSelector } from '../components/dashboard/PeriodSelector'
import type { Period } from '../components/dashboard/PeriodSelector'
import { ClientsManagementModal } from '../components/masterdata/ClientsManagementModal'
import { ProductsManagementModal } from '../components/masterdata/ProductsManagementModal'
import { SuppliersManagementModal } from '../components/masterdata/SuppliersManagementModal'
import { ActionItemsTodoList } from '../components/dashboard/ActionItemsTodoList'
import { Users, Package, Building2, TrendingUp, DollarSign } from 'lucide-react'

export function DashboardPage() {
  const [showClientsModal, setShowClientsModal] = useState(false)
  const [showProductsModal, setShowProductsModal] = useState(false)
  const [showSuppliersModal, setShowSuppliersModal] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-base text-gray-600">
            Welcome to your inventory management system
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Action Items TODO List */}
        <ActionItemsTodoList />

        <div className="border-t border-gray-300 pt-8"></div>

        {/* KPI Analytics Section */}
        <div className="space-y-6">
          {/* Section Header with Period Selector */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Business Performance Analytics</h2>
              <p className="mt-1 text-base text-gray-600">
                Key metrics and insights filtered by time period
              </p>
            </div>
            <PeriodSelector selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} />
          </div>

          {/* Collapsible KPI Sections */}
          <div className="space-y-4">
            <CollapsibleSection
              title="Sales Performance"
              icon={TrendingUp}
              iconColor="text-green-600"
              defaultOpen={true}
            >
              <SalesMetricsSection dateParams={{ period: selectedPeriod }} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Financial Performance"
              icon={DollarSign}
              iconColor="text-blue-600"
              defaultOpen={false}
            >
              <FinancialMetricsSection dateParams={{ period: selectedPeriod }} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Top Clients"
              icon={Users}
              iconColor="text-purple-600"
              defaultOpen={false}
            >
              <TopClientsSection dateParams={{ period: selectedPeriod }} />
            </CollapsibleSection>

            <CollapsibleSection
              title="Top Products"
              icon={Package}
              iconColor="text-orange-600"
              defaultOpen={false}
            >
              <TopProductsSection dateParams={{ period: selectedPeriod }} />
            </CollapsibleSection>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-8"></div>

        {/* Master Data Section */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Master Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Clients Button */}
            <button
              onClick={() => setShowClientsModal(true)}
              className="flex items-center gap-4 p-8 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-shrink-0">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Clients</h3>
                <p className="text-base text-gray-600">Manage your clients</p>
              </div>
            </button>

            {/* Products Button */}
            <button
              onClick={() => setShowProductsModal(true)}
              className="flex items-center gap-4 p-8 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-shrink-0">
                <Package className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Products</h3>
                <p className="text-base text-gray-600">Manage your products</p>
              </div>
            </button>

            {/* Suppliers Button */}
            <button
              onClick={() => setShowSuppliersModal(true)}
              className="flex items-center gap-4 p-8 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-shrink-0">
                <Building2 className="w-10 h-10 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Suppliers</h3>
                <p className="text-base text-gray-600">Manage your suppliers</p>
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
