import { ReactNode, useEffect, useRef } from 'react'
import { useKeyboardAwareViewport } from '../../hooks/useKeyboardAwareViewport'

interface KeyboardAwareModalProps {
  isOpen: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
  /**
   * Maximum height of modal as viewport percentage when keyboard is hidden
   * @default 90
   */
  maxHeightPercent?: number
}

/**
 * A modal wrapper that automatically adjusts for virtual keyboard on mobile devices.
 * Wraps modal content and adjusts height/scroll when keyboard appears.
 *
 * @example
 * <KeyboardAwareModal isOpen={isOpen}>
 *   <div className="modal-header">...</div>
 *   <div className="modal-body">...</div>
 *   <div className="modal-footer">...</div>
 * </KeyboardAwareModal>
 */
export function KeyboardAwareModal({
  isOpen,
  children,
  className = '',
  contentClassName = '',
  maxHeightPercent = 90,
}: KeyboardAwareModalProps) {
  const { isVisible: isKeyboardVisible, height: keyboardHeight, viewportHeight } = useKeyboardAwareViewport()
  const modalRef = useRef<HTMLDivElement>(null)

  // Calculate dynamic max height based on keyboard state
  const getMaxHeight = () => {
    if (isKeyboardVisible && viewportHeight > 0) {
      // When keyboard is visible, use the visual viewport height with some padding
      return `${viewportHeight - 40}px`
    }
    // When keyboard is hidden, use percentage of window height
    return `${maxHeightPercent}vh`
  }

  // Handle modal positioning when keyboard appears
  useEffect(() => {
    if (!isOpen || !modalRef.current) {
      return
    }

    if (isKeyboardVisible) {
      // Ensure modal scrolls to show focused input
      const focusedElement = document.activeElement as HTMLElement

      if (
        focusedElement &&
        modalRef.current.contains(focusedElement) &&
        (focusedElement.tagName === 'INPUT' ||
         focusedElement.tagName === 'TEXTAREA' ||
         focusedElement.tagName === 'SELECT')
      ) {
        // Small delay to let keyboard animation complete
        setTimeout(() => {
          focusedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }, 100)
      }
    }
  }, [isKeyboardVisible, isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div
      ref={modalRef}
      className={`keyboard-aware-modal ${className}`}
      style={{
        maxHeight: getMaxHeight(),
        transition: 'max-height 0.2s ease-out',
      }}
    >
      <div className={contentClassName}>
        {children}
      </div>
    </div>
  )
}

/**
 * A simplified modal overlay that handles keyboard-aware content
 * Provides common modal structure with backdrop, centered content, and keyboard handling
 */
interface KeyboardAwareModalOverlayProps extends KeyboardAwareModalProps {
  onClose?: () => void
  showBackdrop?: boolean
  closeOnBackdropClick?: boolean
}

export function KeyboardAwareModalOverlay({
  isOpen,
  onClose,
  children,
  className = '',
  contentClassName = '',
  maxHeightPercent = 90,
  showBackdrop = true,
  closeOnBackdropClick = true,
}: KeyboardAwareModalOverlayProps) {
  const { isVisible: isKeyboardVisible, viewportHeight } = useKeyboardAwareViewport()

  if (!isOpen) {
    return null
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget && onClose) {
      onClose()
    }
  }

  // Calculate dynamic max height
  const getMaxHeight = () => {
    if (isKeyboardVisible && viewportHeight > 0) {
      return `${viewportHeight - 40}px`
    }
    return `${maxHeightPercent}vh`
  }

  return (
    <div
      className={`fixed inset-0 flex items-start justify-center z-50 ${showBackdrop ? 'bg-black bg-opacity-50' : ''} p-4`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full flex flex-col ${className}`}
        style={{
          maxHeight: getMaxHeight(),
          transition: 'max-height 0.2s ease-out',
          marginTop: isKeyboardVisible ? '1rem' : '2rem',
        }}
      >
        <div className={`flex-1 overflow-y-auto ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  )
}
