import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useClients } from '../../hooks/useClients';
import { useProducts } from '../../hooks/useProducts';
import { useSuppliers } from '../../hooks/useSuppliers';
import { Database, Users, Package, Building2 } from 'lucide-react';
import { ClientsManagementModal } from '../masterdata/ClientsManagementModal';
import { ProductsManagementModal } from '../masterdata/ProductsManagementModal';
import { SuppliersManagementModal } from '../masterdata/SuppliersManagementModal';

export function MasterDataSection() {
  const queryClient = useQueryClient();
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);

  const { data: clients = [] } = useClients();
  const { data: products = [] } = useProducts();
  const { data: suppliers = [] } = useSuppliers();

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Master Data Management</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your clients, products, and suppliers
        </p>
      </div>

      {/* Management Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Clients Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Clients</h3>
              <p className="text-sm text-gray-500">{clients.length} total</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manage your client database and contact information
          </p>
          <button
            onClick={() => setShowClientsModal(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage Clients
          </button>
        </div>

        {/* Products Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Products</h3>
              <p className="text-sm text-gray-500">{products.length} total</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manage your product catalog and inventory items
          </p>
          <button
            onClick={() => setShowProductsModal(true)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Manage Products
          </button>
        </div>

        {/* Suppliers Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Suppliers</h3>
              <p className="text-sm text-gray-500">{suppliers.length} total</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Manage your supplier relationships and contacts
          </p>
          <button
            onClick={() => setShowSuppliersModal(true)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage Suppliers
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Database className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">Master Data</p>
          <p className="text-blue-800">
            Keep your master data up-to-date to ensure smooth operations across transactions, procurement, and inventory management.
          </p>
        </div>
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
  );
}
