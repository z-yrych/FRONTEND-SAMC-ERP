import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { SmartComboBox } from '../ui/SmartComboBox'
import { ProductLineItem, type LineItem } from './ProductLineItem'
import { useCreateTransaction } from '../../hooks/useTransactions'
import { useKeyboardAwareViewport } from '../../hooks/useKeyboardAwareViewport'
import type { Client, Product } from '../../lib/api/transactions'

interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  clients?: Client[]
  products?: Product[]
}

export function CreateTransactionModal({
  isOpen,
  onClose,
  onSuccess,
  clients = [],
  products = []
}: CreateTransactionModalProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [transactionType, setTransactionType] = useState<'rfq' | 'client_po'>('rfq')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { quantity: 1, isNew: false }
  ])
  const [notes, setNotes] = useState('')

  const createTransactionMutation = useCreateTransaction()
  const { isVisible: isKeyboardVisible, viewportHeight } = useKeyboardAwareViewport()

  if (!isOpen) return null

  // Calculate dynamic max height based on keyboard state
  const getMaxHeight = () => {
    if (isKeyboardVisible && viewportHeight > 0) {
      return `${viewportHeight - 40}px`
    }
    return '90vh'
  }

  const handleClientSelect = (client: { id: string; name: string }) => {
    setSelectedClient(client as Client)
  }

  const handleClientCreate = async (name: string): Promise<{ id: string; name: string }> => {
    // TODO: Call API to create client
    const newClient = {
      id: `new-client-${Date.now()}`,
      name
    }
    setSelectedClient(newClient)
    return newClient
  }

  const handleLineItemChange = (index: number, item: LineItem) => {
    const newItems = [...lineItems]
    newItems[index] = item
    setLineItems(newItems)
  }

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { quantity: 1, isNew: false }])
  }

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  const isValid = () => {
    if (!selectedClient) return false

    return lineItems.every(item => {
      if (!item.productId) return false
      if (item.quantity < 1) return false
      if (item.isNew && !item.category) return false
      return true
    })
  }

  const handleSubmit = async () => {
    if (!isValid() || !selectedClient) return

    try {
      const payload = {
        // For existing clients, send ID. For new clients, send only name
        ...(selectedClient.id.startsWith('new-')
          ? { clientName: selectedClient.name }
          : { clientId: selectedClient.id }
        ),
        transactionType,
        lineItems: lineItems.map(item => ({
          // For existing products, send ID. For new products, send only name
          ...(item.productId?.startsWith('new-')
            ? { productName: item.productName }
            : { productId: item.productId }
          ),
          quantity: item.quantity
        })),
        notes: notes || undefined
      }

      await createTransactionMutation.mutateAsync(payload)

      // Reset form
      setSelectedClient(null)
      setLineItems([{ quantity: 1, isNew: false }])
      setNotes('')

      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Failed to create transaction:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50">
      <div
        className="bg-white rounded-lg w-full max-w-4xl flex flex-col"
        style={{
          maxHeight: getMaxHeight(),
          transition: 'max-height 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-7 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Create New Transaction</h2>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-7 space-y-7 overflow-y-auto flex-1">
          {/* Transaction Type */}
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-5">TRANSACTION TYPE</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="rfq"
                  checked={transactionType === 'rfq'}
                  onChange={(e) => setTransactionType(e.target.value as 'rfq' | 'client_po')}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-base font-medium text-gray-700">
                  RFQ (Request for Quotation)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="client_po"
                  checked={transactionType === 'client_po'}
                  onChange={(e) => setTransactionType(e.target.value as 'rfq' | 'client_po')}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-base font-medium text-gray-700">
                  Client PO (Purchase Order - Deal Closed)
                </span>
              </label>
            </div>
            {transactionType === 'client_po' && (
              <p className="mt-3 text-base text-gray-500">
                Client has already committed to purchase. Quote steps will be skipped.
              </p>
            )}
          </div>

          {/* Client Information */}
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-5">CLIENT INFORMATION</h3>
            <SmartComboBox
              label="Client"
              placeholder="Search existing clients or type to create new..."
              options={clients.map(c => ({ id: c.id, name: c.name }))}
              onSelect={handleClientSelect}
              onCreate={handleClientCreate}
              value={selectedClient}
            />
          </div>

          {/* Product Line Items */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-medium text-gray-900">PRODUCT LINE ITEMS</h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-2 px-4 py-2.5 text-base font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
              >
                <Plus className="h-5 w-5" />
                Add Product
              </button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, index) => (
                <ProductLineItem
                  key={index}
                  index={index}
                  value={item}
                  onChange={handleLineItemChange}
                  onRemove={handleRemoveLineItem}
                  products={products}
                />
              ))}
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-xl font-medium text-gray-900 mb-5">TRANSACTION DETAILS</h3>
            <div>
              <label className="block text-base font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Multi-line text area for client's request..."
                rows={4}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 p-7 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid() || createTransactionMutation.isPending}
            className="px-6 py-3 text-base font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createTransactionMutation.isPending ? 'Creating...' : 'Save as Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}