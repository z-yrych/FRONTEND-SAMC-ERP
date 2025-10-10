import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { X, FileText, Package, Building2, Users, AlertCircle, CheckCircle2, Edit } from 'lucide-react';
import api from '../../lib/axios';
import { ProductFormModal } from '../products/ProductFormModal';
import { SupplierFormModal } from './SupplierFormModal';
import { ClientFormModal } from './ClientFormModal';
import { updateProduct, type Product } from '../../lib/api/products';
import { updateSupplier, type Supplier } from '../../lib/api/suppliers';
import { updateClient, type Client } from '../../lib/api/clients';
import { showSuccess, showError } from '../../lib/toast';

interface IncompleteMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'suppliers' | 'clients' | 'products';
}

interface IncompleteProduct {
  id: string;
  name: string;
  stockType: string;
  missingFields: {
    unit: boolean;
    manufacturer: boolean;
    suppliers: boolean;
  };
  isCritical: boolean;
}

interface IncompleteSupplier {
  id: string;
  name: string;
  missingFields: {
    email: boolean;
    contactPerson: boolean;
    phone: boolean;
    address: boolean;
  };
  isCritical: boolean;
}

interface IncompleteClient {
  id: string;
  name: string;
  missingFields: {
    email: boolean;
    phone: boolean;
    address: boolean;
  };
  isCritical: boolean;
}

export function IncompleteMasterDataModal({
  isOpen,
  onClose,
  initialTab = 'products'
}: IncompleteMasterDataModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'suppliers' | 'clients' | 'products'>(initialTab);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductFormModal, setShowProductFormModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showSupplierFormModal, setShowSupplierFormModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showClientFormModal, setShowClientFormModal] = useState(false);

  // Fetch incomplete products
  const { data: incompleteProducts = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['incomplete-products'],
    queryFn: async () => {
      const response = await api.get('/master-data/incomplete-products');
      return response.data as IncompleteProduct[];
    },
    enabled: isOpen,
  });

  // Fetch incomplete suppliers
  const { data: incompleteSuppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['incomplete-suppliers'],
    queryFn: async () => {
      const response = await api.get('/master-data/incomplete-suppliers');
      return response.data as IncompleteSupplier[];
    },
    enabled: isOpen && activeTab === 'suppliers',
  });

  // Fetch incomplete clients
  const { data: incompleteClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['incomplete-clients'],
    queryFn: async () => {
      const response = await api.get('/master-data/incomplete-clients');
      return response.data as IncompleteClient[];
    },
    enabled: isOpen && activeTab === 'clients',
  });

  // Handle editing a product
  const handleEditProduct = async (productId: string) => {
    try {
      // Fetch full product details
      const response = await api.get(`/products/${productId}`);
      setEditingProduct(response.data);
      setShowProductFormModal(true);
    } catch (error) {
      showError('Failed to load product details');
    }
  };

  // Handle product update
  const handleProductUpdate = async (data: any) => {
    if (!editingProduct) return;

    try {
      await updateProduct(editingProduct.id, data);
      showSuccess('Product updated successfully!');

      // Refresh incomplete products list
      queryClient.invalidateQueries({ queryKey: ['incomplete-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['master-data-incomplete-stats'] });

      setShowProductFormModal(false);
      setEditingProduct(null);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update product');
    }
  };

  // Handle editing a supplier
  const handleEditSupplier = async (supplierId: string) => {
    try {
      // Fetch full supplier details
      const response = await api.get(`/suppliers/${supplierId}`);
      setEditingSupplier(response.data);
      setShowSupplierFormModal(true);
    } catch (error) {
      showError('Failed to load supplier details');
    }
  };

  // Handle supplier update
  const handleSupplierUpdate = async (data: any) => {
    if (!editingSupplier) return;

    try {
      await updateSupplier(editingSupplier.id, data);
      showSuccess('Supplier updated successfully!');

      // Refresh incomplete suppliers list
      queryClient.invalidateQueries({ queryKey: ['incomplete-suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['master-data-incomplete-stats'] });

      setShowSupplierFormModal(false);
      setEditingSupplier(null);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update supplier');
    }
  };

  // Handle editing a client
  const handleEditClient = async (clientId: string) => {
    try {
      // Fetch full client details
      const response = await api.get(`/clients/${clientId}`);
      setEditingClient(response.data);
      setShowClientFormModal(true);
    } catch (error) {
      showError('Failed to load client details');
    }
  };

  // Handle client update
  const handleClientUpdate = async (data: any) => {
    if (!editingClient) return;

    try {
      await updateClient(editingClient.id, data);
      showSuccess('Client updated successfully!');

      // Refresh incomplete clients list
      queryClient.invalidateQueries({ queryKey: ['incomplete-clients'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['master-data-incomplete-stats'] });

      setShowClientFormModal(false);
      setEditingClient(null);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update client');
    }
  };

  if (!isOpen) return null;

  const getMissingFieldsList = (missingFields: any): string[] => {
    return Object.entries(missingFields)
      .filter(([_, isMissing]) => isMissing)
      .map(([field, _]) => {
        // Capitalize and format field names
        return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
      });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-orange-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Complete Master Data</h2>
                  <p className="text-sm text-gray-500">Review and complete missing information</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-4 mt-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'products'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>Products</span>
                  {incompleteProducts.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {incompleteProducts.length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('suppliers')}
                className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'suppliers'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Suppliers</span>
                  {incompleteSuppliers.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {incompleteSuppliers.length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'clients'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Clients</span>
                  {incompleteClients.length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {incompleteClients.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <div>
                {loadingProducts ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading products...</p>
                  </div>
                ) : incompleteProducts.length === 0 ? (
                  <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-900 mb-1">All Products Complete!</h3>
                    <p className="text-sm text-green-700">All products have complete information.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        {incompleteProducts.length} product{incompleteProducts.length !== 1 ? 's' : ''} with missing information
                      </p>
                    </div>

                    {incompleteProducts.map((product) => {
                      const missingFieldsList = getMissingFieldsList(product.missingFields);
                      return (
                        <div
                          key={product.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium capitalize">
                                  {product.stockType.replace('_', ' ')}
                                </span>
                              </div>

                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Missing:</span>{' '}
                                  {missingFieldsList.join(', ')}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleEditProduct(product.id)}
                              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors ml-4"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
              <div>
                {loadingSuppliers ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading suppliers...</p>
                  </div>
                ) : incompleteSuppliers.length === 0 ? (
                  <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-900 mb-1">All Suppliers Complete!</h3>
                    <p className="text-sm text-green-700">All suppliers have complete information.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        {incompleteSuppliers.length} supplier{incompleteSuppliers.length !== 1 ? 's' : ''} with missing information
                      </p>
                    </div>

                    {incompleteSuppliers.map((supplier) => {
                      const missingFieldsList = getMissingFieldsList(supplier.missingFields);
                      return (
                        <div
                          key={supplier.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                                {supplier.isCritical && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                    Blocks RFQs/POs
                                  </span>
                                )}
                              </div>

                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Missing:</span>{' '}
                                  {missingFieldsList.join(', ')}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleEditSupplier(supplier.id)}
                              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors ml-4"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Clients Tab */}
            {activeTab === 'clients' && (
              <div>
                {loadingClients ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Loading clients...</p>
                  </div>
                ) : incompleteClients.length === 0 ? (
                  <div className="text-center py-12 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-green-900 mb-1">All Clients Complete!</h3>
                    <p className="text-sm text-green-700">All clients have complete information.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-600">
                        {incompleteClients.length} client{incompleteClients.length !== 1 ? 's' : ''} with missing information
                      </p>
                    </div>

                    {incompleteClients.map((client) => {
                      const missingFieldsList = getMissingFieldsList(client.missingFields);
                      return (
                        <div
                          key={client.id}
                          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{client.name}</h3>
                                {client.isCritical && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                    Blocks Quotes/Invoices
                                  </span>
                                )}
                              </div>

                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Missing:</span>{' '}
                                  {missingFieldsList.join(', ')}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleEditClient(client.id)}
                              className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors ml-4"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showProductFormModal && editingProduct && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => {
            setShowProductFormModal(false);
            setEditingProduct(null);
          }}
          onSubmit={handleProductUpdate}
          isSubmitting={false}
        />
      )}

      {/* Supplier Form Modal */}
      {showSupplierFormModal && editingSupplier && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => {
            setShowSupplierFormModal(false);
            setEditingSupplier(null);
          }}
          onSubmit={handleSupplierUpdate}
          isSubmitting={false}
        />
      )}

      {/* Client Form Modal */}
      {showClientFormModal && editingClient && (
        <ClientFormModal
          client={editingClient}
          onClose={() => {
            setShowClientFormModal(false);
            setEditingClient(null);
          }}
          onSubmit={handleClientUpdate}
          isSubmitting={false}
        />
      )}
    </>
  );
}
