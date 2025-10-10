# Phase 5: Transactions Page Implementation Plan

## Overview
The Transactions Page serves as the primary entry point for the Sales Hub, providing a clean overview of all transactions and enabling creation of new ones.

## Key Features
1. **[+ New Transaction] Button** - Primary CTA opening the creation modal/flow
2. **Search & Filter** - Quick access to specific transactions
3. **Transaction List** - Scannable table with clickable rows leading to Deal Hub

## Backend Integration Points

### Available Endpoints
- `GET /transactions` - Fetch all transactions (with optional status filter)
- `GET /transactions/:id` - Get single transaction details
- `POST /transactions` - Create new transaction
- `PUT /transactions/:id/status` - Update transaction status
- `GET /transactions/:id/costing-analysis` - Get pricing breakdown

### Transaction Status Flow
```
DRAFT → SOURCING → QUOTED → ACCEPTED →
  → PARTIALLY_ALLOCATED / WAITING_FOR_ITEMS → READY_FOR_DELIVERY
  → OUT_FOR_DELIVERY → DELIVERED → COMPLETED
```

## Frontend Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand for global state, React Query for server state
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table v8
- **Date Handling**: date-fns

### Folder Structure
```
frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Dashboard layout with sidebar
│   │   ├── transactions/
│   │   │   ├── page.tsx            # Transactions list page
│   │   │   ├── loading.tsx         # Loading skeleton
│   │   │   └── error.tsx           # Error boundary
│   │   └── transactions/[id]/
│   │       └── page.tsx            # Deal Hub (future)
│   └── api/
│       └── transactions/           # API route handlers
├── components/
│   ├── transactions/
│   │   ├── TransactionsTable.tsx   # Main table component
│   │   ├── TransactionRow.tsx      # Table row component
│   │   ├── TransactionFilters.tsx  # Search and filter bar
│   │   ├── CreateTransactionModal.tsx # Creation modal
│   │   └── StatusBadge.tsx         # Status display component
│   └── ui/                         # shadcn/ui components
├── hooks/
│   ├── useTransactions.ts          # React Query hook
│   ├── useCreateTransaction.ts     # Mutation hook
│   └── useDebounce.ts              # Search debounce
├── lib/
│   ├── api/
│   │   └── transactions.ts         # API client functions
│   ├── utils/
│   │   ├── formatters.ts           # Date, currency formatters
│   │   └── status-helpers.ts       # Status utilities
│   └── validations/
│       └── transaction.ts          # Zod schemas
└── stores/
    └── transactionStore.ts         # Zustand store

```

## Component Specifications

### 1. TransactionsTable Component
```typescript
interface TransactionsTableProps {
  transactions: Transaction[]
  isLoading: boolean
  onRowClick: (id: string) => void
}

Features:
- Sortable columns (Transaction #, Date, Amount)
- Status badge with color coding
- Responsive design (mobile: card view, desktop: table)
- Empty state with CTA
- Loading skeleton
```

### 2. TransactionFilters Component
```typescript
interface TransactionFiltersProps {
  onSearch: (query: string) => void
  onStatusFilter: (status: TransactionStatus | 'all') => void
  onCreateNew: () => void
}

Features:
- Debounced search input (300ms)
- Status dropdown with counts
- Clear filters button
- Responsive layout
```

### 3. CreateTransactionModal Component
```typescript
interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (transaction: Transaction) => void
}

Form Structure:
- Single-page modal (not wizard)
- Three sections: Client, Line Items, Details
- Save as Draft action

Features:
- Smart combo-box inputs (search or create)
- Dynamic product line items
- Category required for new products
- Auto-save draft on modal close
- Inline validation
```

### 4. StatusBadge Component
```typescript
interface StatusBadgeProps {
  status: TransactionStatus
  size?: 'sm' | 'md' | 'lg'
}

Color Mapping:
- DRAFT: gray
- SOURCING: blue
- QUOTED: purple
- ACCEPTED: green
- PARTIALLY_ALLOCATED: orange
- WAITING_FOR_ITEMS: yellow
- READY_FOR_DELIVERY: teal
- OUT_FOR_DELIVERY: indigo
- DELIVERED: green
- COMPLETED: gray
- CANCELLED: red
```

## State Management Strategy

### Server State (React Query)
```typescript
// hooks/useTransactions.ts
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => fetchTransactions(filters),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000 // 1 minute
  })
}
```

### Local State (Zustand)
```typescript
// stores/transactionStore.ts
interface TransactionStore {
  // UI State
  searchQuery: string
  statusFilter: TransactionStatus | 'all'
  isCreateModalOpen: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setStatusFilter: (status: TransactionStatus | 'all') => void
  openCreateModal: () => void
  closeCreateModal: () => void
}
```

## API Integration Layer

### Type Definitions
```typescript
// lib/types/transaction.ts
export interface Transaction {
  id: string
  transactionNumber: string
  client: {
    id: string
    name: string
  }
  status: TransactionStatus
  totalAmount: number
  lineItems: TransactionLineItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionDto {
  clientId: string
  lineItems: Array<{
    productId: string
    quantity: number
  }>
  notes?: string
}
```

### API Client
```typescript
// lib/api/transactions.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function fetchTransactions(filters?: TransactionFilters) {
  const params = new URLSearchParams()
  if (filters?.status) params.append('status', filters.status)

  const response = await fetch(`${API_BASE}/transactions?${params}`)
  if (!response.ok) throw new Error('Failed to fetch transactions')
  return response.json()
}

export async function createTransaction(data: CreateTransactionDto) {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to create transaction')
  return response.json()
}
```

## Implementation Sequence

### Phase 5A: Basic Setup (Day 1)
1. ✅ Set up Next.js project with TypeScript
2. ✅ Install dependencies (shadcn/ui, React Query, Zustand, etc.)
3. ✅ Configure Tailwind CSS and shadcn/ui
4. ✅ Create folder structure
5. ✅ Set up API client base

### Phase 5B: Core Components (Day 2)
1. ⬜ Implement TransactionsTable with mock data
2. ⬜ Create StatusBadge component
3. ⬜ Build TransactionFilters component
4. ⬜ Add loading and empty states
5. ⬜ Implement responsive design

### Phase 5C: Data Integration (Day 3)
1. ⬜ Set up React Query provider
2. ⬜ Create useTransactions hook
3. ⬜ Implement API integration
4. ⬜ Add error handling
5. ⬜ Connect filters to API

### Phase 5D: Transaction Creation (Day 4)
1. ⬜ Build CreateTransactionModal
2. ⬜ Implement multi-step form
3. ⬜ Add client selection/creation
4. ⬜ Add product line items
5. ⬜ Connect to create API

### Phase 5E: Polish & Testing (Day 5)
1. ⬜ Add animations and transitions
2. ⬜ Implement keyboard navigation
3. ⬜ Add accessibility features
4. ⬜ Write unit tests
5. ⬜ Performance optimization

## Additional Component Specifications

### 5. SmartComboBox Component (Reusable)
```typescript
interface SmartComboBoxProps {
  label: string
  placeholder: string
  options: Array<{ id: string; name: string }>
  onSelect: (value: { id: string; name: string }) => void
  onCreate: (name: string) => Promise<{ id: string; name: string }>
  loading?: boolean
}

Features:
- Search existing records
- "Create new" option when no match
- Debounced search
- Loading states
- Keyboard navigation
```

### 6. ProductLineItem Component
```typescript
interface ProductLineItemProps {
  index: number
  value: LineItem
  onChange: (index: number, item: LineItem) => void
  onRemove: (index: number) => void
  products: Product[]
}

interface LineItem {
  productId?: string
  productName?: string
  quantity: number
  category?: 'consumable' | 'non-consumable'
  isNew?: boolean
}

Features:
- Product search/create combo
- Quantity input with validation
- Category dropdown (shown for new products)
- Remove button
- Inline error messages
```

### 7. DealHub Component (Transaction Details)
```typescript
interface DealHubProps {
  transactionId: string
}

Sections:
1. Header with status and client info
2. Collapsible phase sections:
   - Quoting (Phase 1-2)
   - Fulfillment (Phase 3-4)
   - Procurement (Phase 4)
   - Invoicing & Payments (Phase 5-6)

Features:
- Progressive disclosure based on status
- Expandable/collapsible sections
- Action buttons contextual to phase
- Real-time status updates
- Audit trail in each section
```

## UI/UX Considerations

### Desktop View - Transactions List
```
┌─────────────────────────────────────────────────────────────────────┐
│ SALES HUB                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Search transactions...]  [Status: All ▼]  [+ New Transaction]  │
├─────────────────────────────────────────────────────────────────────┤
│ Transaction #  │ Client Name     │ Status          │ Amount   │ Date │
├────────────────┼─────────────────┼─────────────────┼──────────┼──────┤
│ TXN-202509-001 │ St. Luke's      │ 🟡 Awaiting     │ ₱300.00  │ Today│
│ TXN-202509-002 │ ABC Hospital    │ 🔵 Procurement  │ ₱12,500  │ Sept │
└─────────────────────────────────────────────────────────────────────┘
```

### Create Transaction Modal
```
┌──────────────────────────────────────────────────────────────┐
│ Create New Transaction                                   [X] │
├──────────────────────────────────────────────────────────────┤
│ CLIENT INFORMATION                                           │
│ [🔍 Search existing clients or type to create new... ▼]      │
├──────────────────────────────────────────────────────────────┤
│ PRODUCT LINE ITEMS                        [+ Add Product]    │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ [🔍 Product] | Qty: [100] | Category: [Consumable ▼] 🗑️│  │
│ └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│ TRANSACTION DETAILS                                          │
│ Description:                                                 │
│ [Multi-line text area...                                ]    │
├──────────────────────────────────────────────────────────────┤
│                              [Cancel] [Save as Draft]        │
└──────────────────────────────────────────────────────────────┘
```

### Deal Hub View
```
┌─────────────────────────────────────────────────────────────────┐
│ DEAL HUB: TRANSACTION #TXN-202509-001                          │
│ CLIENT: St. Luke's Hospital                                    │
│ OVERALL STATUS: [Procurement]                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✅ 1. QUOTING [Completed - Click to Expand]                    │
│     Summary: Quote #QUO-001 accepted for ₱30,000              │
├─────────────────────────────────────────────────────────────────┤
│ ▶️ 2. FULFILLMENT [In Progress]                                │
│     Order #: ORD-00123 | Status: Procurement                   │
│     Product A: 10/10 Allocated ✅                              │
│     Product B: 5/20 Allocated 🔘 (15 Backordered)             │
├─────────────────────────────────────────────────────────────────┤
│ ▶️ 3. PROCUREMENT [In Progress]                                │
│     PO #PO-00234 | MedSupplies Inc. | Status: Confirmed       │
│     [View PO] [Mark Fulfilled]                                 │
├─────────────────────────────────────────────────────────────────┤
│ 🔒 4. INVOICING & PAYMENTS [Locked - Complete fulfillment first]│
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View (Card Layout)
```
┌─────────────────────────┐
│ [🔍] [Filter] [+ New]   │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ TXN-202509-001      │ │
│ │ St. Luke's Hospital │ │
│ │ 🟡 Awaiting Items   │ │
│ │ ₱300.00 • Today     │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ TXN-202509-002      │ │
│ │ ABC Hospital        │ │
│ │ 🔵 Procurement      │ │
│ │ ₱12,500 • Sept 27   │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Performance Optimizations

1. **Virtual Scrolling**: Use TanStack Virtual for large lists
2. **Debounced Search**: 300ms debounce on search input
3. **Optimistic Updates**: Update UI before server confirmation
4. **Lazy Loading**: Load Deal Hub components on demand
5. **Memoization**: Use React.memo for expensive components

## Error Handling

1. **Network Errors**: Show toast with retry option
2. **Validation Errors**: Inline field errors
3. **Server Errors**: Full-page error boundary with reload
4. **Empty States**: Helpful messages with CTAs
5. **Loading States**: Skeleton screens matching layout

## Accessibility

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Readers**: Proper ARIA labels and live regions
3. **Color Contrast**: WCAG AA compliance
4. **Focus Management**: Clear focus indicators
5. **Mobile Touch**: Minimum 44x44px touch targets

## Testing Strategy

### Unit Tests
- Component rendering
- Status badge color logic
- Date/currency formatting
- Filter logic

### Integration Tests
- API calls
- Form submission
- Search and filter
- Table sorting

### E2E Tests
- Complete transaction creation flow
- Search and filter workflow
- Navigation to Deal Hub

## Success Metrics

1. **Page Load Time**: < 2 seconds
2. **Search Response**: < 300ms
3. **Creation Success Rate**: > 95%
4. **Mobile Usability**: Works on screens ≥ 320px
5. **Accessibility Score**: 100 on Lighthouse

## Phase-Based Section Logic

### Section Visibility Rules
```typescript
const sectionRules = {
  quoting: {
    visible: ['DRAFT', 'SOURCING', 'QUOTED', '*'], // Always visible
    active: ['DRAFT', 'SOURCING'],
    completed: ['ACCEPTED', 'PARTIALLY_ALLOCATED', 'WAITING_FOR_ITEMS', ...]
  },
  fulfillment: {
    visible: ['ACCEPTED', 'PARTIALLY_ALLOCATED', 'WAITING_FOR_ITEMS', ...],
    active: ['ACCEPTED', 'PARTIALLY_ALLOCATED', 'WAITING_FOR_ITEMS'],
    completed: ['READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', ...]
  },
  procurement: {
    visible: ['ACCEPTED', 'PARTIALLY_ALLOCATED', 'WAITING_FOR_ITEMS', ...],
    active: ['PARTIALLY_ALLOCATED', 'WAITING_FOR_ITEMS'],
    completed: ['READY_FOR_DELIVERY', ...]
  },
  invoicing: {
    visible: ['DELIVERED', 'COMPLETED'],
    active: ['DELIVERED'],
    completed: ['COMPLETED']
  }
}
```

### Section States
- **Hidden**: Not shown at all
- **Locked**: Visible but grayed out with lock icon
- **Active**: Expanded and interactive
- **Completed**: Collapsed with checkmark, expandable for details

## Product Categories

### Category Types
```typescript
export enum ProductCategory {
  CONSUMABLE = 'consumable',
  NON_CONSUMABLE = 'non-consumable' // Non-consumable
}

// Category determines payment terms
const paymentTerms = {
  consumable: '30 days net',
  non_consumable: '50% down, 50% on delivery'
}
```

## Next Steps After Implementation

1. **Deal Hub Page**: Full transaction lifecycle view
2. **Sourcing Interface**: Supplier quote logging
3. **Quote Generation**: Client quote creation
4. **Fulfillment Management**: Allocation and delivery
5. **Invoice Generation**: Payment tracking