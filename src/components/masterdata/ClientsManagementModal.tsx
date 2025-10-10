import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClients, createClient, updateClient, deleteClient, type Client, type CreateClientDto, type UpdateClientDto } from '../../lib/api/clients';
import { Plus, Edit, Trash2, Mail, Phone, MapPin, X, User } from 'lucide-react';
import { showSuccess, showError } from '../../lib/toast';
import { SearchInput } from '../common/SearchInput';
import { useSearchFilter } from '../../hooks/useSearchFilter';

interface ClientsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClientsManagementModal({ isOpen, onClose }: ClientsManagementModalProps) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    enabled: isOpen,
  });

  // Add search filtering
  const { searchQuery, setSearchQuery, filteredItems: filteredClients } = useSearchFilter(
    clients,
    ['name', 'email', 'phone', 'address']
  );

  const createMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      showSuccess('Client created successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to create client');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowModal(false);
      setEditingClient(null);
      showSuccess('Client updated successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to update client');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      showSuccess('Client deleted successfully!');
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'Failed to delete client');
    },
  });

  const handleAdd = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Left side - Title with mobile close button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Manage Clients</h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {searchQuery ? `${filteredClients.length} of ${clients.length}` : `${clients.length}`} client{clients.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {/* Close button - Mobile only */}
                <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Right side - Search and actions */}
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex-1 md:flex-initial min-w-0">
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search clients..."
                    className="w-full"
                  />
                </div>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Client</span>
                </button>
                {/* Close button - Desktop only */}
                <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                {searchQuery ? (
                  <>
                    <p className="text-gray-500 mb-2">No clients found matching "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500 mb-4">No clients yet</p>
                    <button
                      onClick={handleAdd}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add Your First Client
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      {client.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.address && (
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="text-xs">{client.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Form Modal */}
      {showModal && (
        <ClientFormModal
          client={editingClient}
          onClose={() => {
            setShowModal(false);
            setEditingClient(null);
          }}
          onSubmit={(data) => {
            if (editingClient) {
              updateMutation.mutate({ id: editingClient.id, data });
            } else {
              createMutation.mutate(data as CreateClientDto);
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </>
  );
}

interface ClientFormModalProps {
  client: Client | null;
  onClose: () => void;
  onSubmit: (data: CreateClientDto | UpdateClientDto) => void;
  isSubmitting: boolean;
}

function ClientFormModal({ client, onClose, onSubmit, isSubmitting }: ClientFormModalProps) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert empty strings to undefined for optional fields
    const sanitizedData = {
      name: formData.name,
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      address: formData.address?.trim() || undefined,
    };

    onSubmit(sanitizedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Client name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Business address"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isSubmitting ? 'Saving...' : client ? 'Update' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
