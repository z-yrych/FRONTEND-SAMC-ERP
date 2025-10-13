#!/bin/bash

# Script to check which modals have keyboard awareness implemented
# Usage: bash check-keyboard-awareness.sh

echo "========================================"
echo "Keyboard Awareness Implementation Status"
echo "========================================"
echo ""

# Find all modal files
MODAL_FILES=$(find src/components -name "*Modal.tsx" | sort)
UPDATED_COUNT=0
PENDING_COUNT=0

echo "UPDATED MODALS (with useKeyboardAwareViewport):"
echo "------------------------------------------------"

for file in $MODAL_FILES; do
  if grep -q "useKeyboardAwareViewport" "$file"; then
    echo "✅ $file"
    ((UPDATED_COUNT++))
  fi
done

echo ""
echo "PENDING MODALS (need update):"
echo "-----------------------------"

for file in $MODAL_FILES; do
  if ! grep -q "useKeyboardAwareViewport" "$file"; then
    echo "⏳ $file"
    ((PENDING_COUNT++))
  fi
done

echo ""
echo "========================================"
echo "SUMMARY:"
echo "  Updated: $UPDATED_COUNT"
echo "  Pending: $PENDING_COUNT"
echo "  Total:   $((UPDATED_COUNT + PENDING_COUNT))"
echo "  Progress: $(awk "BEGIN {printf \"%.1f\", ($UPDATED_COUNT * 100.0) / ($UPDATED_COUNT + $PENDING_COUNT)}")%"
echo "========================================"
echo ""

# Check pages
echo "PAGES STATUS:"
echo "-------------"

PAGES=$(find src/pages -name "*.tsx" | sort)

for file in $PAGES; do
  if grep -q "useKeyboardAwareViewport" "$file"; then
    echo "✅ $file"
  else
    # Check if it has input/textarea elements
    if grep -qE "<input|<textarea" "$file"; then
      echo "⏳ $file (has inputs, needs update)"
    fi
  fi
done

echo ""

# Check SmartComboBox
echo "COMPONENTS STATUS:"
echo "------------------"
if grep -q "useKeyboardAwareViewport" "src/components/ui/SmartComboBox.tsx" 2>/dev/null; then
  echo "✅ SmartComboBox (keyboard aware)"
else
  echo "⏳ SmartComboBox (needs update)"
fi

echo ""
echo "For implementation details, see:"
echo "  frontend/KEYBOARD_AWARE_UI_IMPLEMENTATION.md"
echo ""
