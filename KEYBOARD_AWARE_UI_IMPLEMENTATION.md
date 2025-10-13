# Keyboard-Aware UI Implementation Guide

## Overview
This guide documents the implementation of keyboard-aware UI functionality to prevent mobile virtual keyboards from covering input fields and form elements.

## What Was Implemented

### Phase 1: Core Infrastructure ✅

#### 1. Viewport Meta Tag Update
**File:** `frontend/index.html`

Added `interactive-widget=resizes-visual` to the viewport meta tag:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=resizes-visual" />
```

This tells modern browsers to resize the visual viewport (not the layout viewport) when the keyboard appears, making it easier to detect and handle keyboard visibility with JavaScript.

#### 2. useKeyboardAwareViewport Hook
**File:** `frontend/src/hooks/useKeyboardAwareViewport.ts`

A custom React hook that:
- Detects keyboard show/hide using the Visual Viewport API
- Calculates keyboard height from viewport changes
- Provides a `scrollIntoView` utility to keep focused elements visible
- Automatically scrolls focused inputs into view when keyboard appears
- Works gracefully on desktop (degrades when API not available)

**Usage:**
```typescript
import { useKeyboardAwareViewport } from '../../hooks/useKeyboardAwareViewport'

function MyComponent() {
  const { isVisible, height, viewportHeight, scrollIntoView } = useKeyboardAwareViewport()

  // Use these values to adjust your UI
}
```

#### 3. KeyboardAwareModal Components
**File:** `frontend/src/components/common/KeyboardAwareModal.tsx`

Two wrapper components:
- `KeyboardAwareModal`: Basic wrapper for modal content
- `KeyboardAwareModalOverlay`: Complete modal with backdrop and keyboard handling

**Usage:**
```typescript
import { KeyboardAwareModalOverlay } from '../../components/common/KeyboardAwareModal'

<KeyboardAwareModalOverlay
  isOpen={isOpen}
  onClose={onClose}
  maxHeightPercent={90}
>
  {/* Your modal content */}
</KeyboardAwareModalOverlay>
```

### Phase 2 & 3: High-Priority Components ✅

The following components have been updated with keyboard awareness:

#### Pages:
1. ✅ **BarcodeScannerPage** (`frontend/src/pages/BarcodeScannerPage.tsx`)
   - Manual entry input field scrolls into view when focused

2. ✅ **StockCountSessionPage** (`frontend/src/pages/StockCountSessionPage.tsx`)
   - Scan input field with keyboard awareness
   - Count entry panel inputs (cases, boxes, pieces) scroll into view

#### Modals:
3. ✅ **RecordPaymentModal** (`frontend/src/components/transactions/RecordPaymentModal.tsx`)
   - Dynamic max-height based on keyboard state
   - Multiple form inputs protected from keyboard coverage

4. ✅ **CreateTransactionModal** (`frontend/src/components/transactions/CreateTransactionModal.tsx`)
   - Dynamic max-height adjustment
   - SmartComboBox and textarea inputs keyboard-aware

5. ✅ **ClientFormModal** (`frontend/src/components/masterdata/ClientFormModal.tsx`)
   - All form inputs (name, email, phone, address) protected

6. ✅ **ReceiveGoodsModal** (`frontend/src/components/inventory/ReceiveGoodsModal.tsx`)
   - Complex form with multiple inputs
   - Packaging structure inputs handled

#### Reusable Components:
7. ✅ **SmartComboBox** (`frontend/src/components/ui/SmartComboBox.tsx`)
   - Dropdown scrolls into view when keyboard appears
   - Ensures options remain visible

---

## Remaining Modals to Update (40 modals)

### How to Apply Keyboard Awareness to a Modal

Follow this template for each remaining modal:

#### Step 1: Import the hook
```typescript
import { useKeyboardAwareViewport } from '../../hooks/useKeyboardAwareViewport'
```

#### Step 2: Use the hook in your component
```typescript
export function YourModal({ isOpen, onClose }: Props) {
  const { isVisible: isKeyboardVisible, viewportHeight } = useKeyboardAwareViewport()

  // ... rest of your component
}
```

#### Step 3: Add dynamic max-height calculation
```typescript
// Calculate dynamic max height based on keyboard state
const getMaxHeight = () => {
  if (isKeyboardVisible && viewportHeight > 0) {
    return `${viewportHeight - 40}px`
  }
  return '90vh' // Or whatever your current max-height is
}
```

#### Step 4: Apply to modal container
Replace the static `max-h-[90vh]` class with dynamic style:

**Before:**
```tsx
<div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
```

**After:**
```tsx
<div
  className="bg-white rounded-lg w-full max-w-4xl flex flex-col"
  style={{
    maxHeight: getMaxHeight(),
    transition: 'max-height 0.2s ease-out',
  }}
>
```

---

## List of Remaining Modals

### Transaction Modals
- [ ] AcceptClientQuoteModal
- [ ] GenerateClientQuoteModal
- [ ] GenerateInvoiceModal
- [ ] MarkAsDeliveredModal
- [ ] MarkAsShippedModal
- [ ] SendClientQuoteModal
- [ ] SendInvoiceModal
- [ ] ViewAllTransactionsModal
- [ ] TransactionProcurementMethodModal

### Procurement Modals
- [ ] ConfirmPurchaseOrdersModal
- [ ] ReceivePurchaseOrdersModal
- [ ] SendPurchaseOrdersModal

### RFQ & Quotes Modals
- [ ] RFQModal
- [ ] QuoteReviewModal
- [ ] QuoteComparisonModal
- [ ] ManualRejectQuoteModal
- [ ] SendClientQuoteMethodModal
- [ ] SupplierQuoteEntry (component)
- [ ] ClientQuoteGeneration (component)

### Restocking RFQ Modals
- [ ] RestockingRFQModal
- [ ] RestockingRFQDetailModal
- [ ] RestockingRFQListModal
- [ ] RestockingMethodModal

### Inventory Modals
- [ ] RestockModal
- [ ] StartStockCountModal
- [ ] PackagingStructureModal
- [ ] ReceiptConfirmationModal
- [ ] ProductBatchesModal

### Master Data Modals
- [ ] SupplierFormModal
- [ ] SuppliersManagementModal
- [ ] ClientsManagementModal
- [ ] ProductsManagementModal
- [ ] ProductFormModal
- [ ] IncompleteMasterDataModal
- [ ] SupplierSelectionModal
- [ ] PriceHistoryModal
- [ ] SetAlertLevelsModal

### Fulfillment Modals
- [ ] ShippingModal
- [ ] DeliveryConfirmationModal

### Invoicing Modals
- [ ] InvoiceGenerationModal
- [ ] PaymentRecordModal

### Stock Count Modals
- [ ] AdjustmentApprovalModal
- [ ] SessionHistoryModal

---

## Testing Checklist

When updating each modal, test the following:

1. **Desktop browser**: Modal should work exactly as before
2. **Mobile device (or DevTools mobile emulation)**:
   - Open modal
   - Focus on input field near the bottom
   - Verify input stays visible above keyboard
   - Verify modal height adjusts dynamically
   - Test textarea inputs
   - Test select dropdowns
   - Test SmartComboBox components
3. **Keyboard animations**: Should be smooth (0.2s transition)
4. **Multiple inputs**: Tab between fields, ensure all remain visible
5. **Long forms**: Scroll behavior should work correctly

---

## Browser Support

The implementation uses the **Visual Viewport API**, which is supported in:
- ✅ Chrome/Edge 61+
- ✅ Safari 13+
- ✅ Firefox 91+
- ✅ All modern mobile browsers

For older browsers, the hook degrades gracefully and has no effect (default browser behavior).

---

## Benefits

1. **Better Mobile UX**: Users can see what they're typing
2. **Reduced Errors**: Action buttons remain accessible
3. **Professional Feel**: Smooth transitions and responsive behavior
4. **Accessibility**: Easier for users with mobility/vision needs
5. **No Breaking Changes**: Works on desktop without any changes

---

## Performance Considerations

- The hook uses `requestAnimationFrame` for optimal performance
- Event listeners are properly cleaned up on unmount
- Minimal re-renders (only when keyboard state actually changes)
- No external dependencies (pure React + browser APIs)

---

## Future Enhancements

Consider these improvements:

1. **Dropdown positioning**: Auto-flip dropdowns that would be covered
2. **Focus management**: Automatically focus first input when modal opens
3. **Keyboard dismiss**: Handle explicit keyboard dismissal
4. **Animation polish**: Coordinate modal animations with keyboard timing
5. **iOS Safari quirks**: Handle iOS-specific viewport behavior

---

## Questions or Issues?

The implementation follows React best practices and is fully typed with TypeScript. All changes are backward-compatible and don't affect desktop behavior.

For any issues or questions about the implementation, refer to:
- `/frontend/src/hooks/useKeyboardAwareViewport.ts` - The core hook
- `/frontend/src/components/common/KeyboardAwareModal.tsx` - Wrapper components
- Any of the updated components for implementation examples
