import { useState, useEffect, useCallback, useRef } from 'react'

interface KeyboardState {
  isVisible: boolean
  height: number
  viewportHeight: number
}

interface UseKeyboardAwareViewportReturn extends KeyboardState {
  scrollIntoView: (element: HTMLElement, offset?: number) => void
}

/**
 * Custom hook to handle virtual keyboard visibility on mobile devices
 * Uses the Visual Viewport API to detect keyboard show/hide events
 * and provides utilities to keep focused elements visible
 */
export function useKeyboardAwareViewport(): UseKeyboardAwareViewportReturn {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    viewportHeight: window.innerHeight,
  })

  const initialHeightRef = useRef<number>(window.innerHeight)
  const isKeyboardVisibleRef = useRef<boolean>(false)

  const handleViewportResize = useCallback(() => {
    if (!window.visualViewport) {
      return
    }

    const visualViewport = window.visualViewport
    const currentHeight = visualViewport.height
    const layoutHeight = window.innerHeight

    // Calculate keyboard height
    // Keyboard is considered visible if visual viewport is significantly smaller than layout viewport
    const heightDifference = layoutHeight - currentHeight
    const isKeyboardVisible = heightDifference > 150 // Threshold for keyboard detection (150px)

    // If keyboard state changed
    if (isKeyboardVisible !== isKeyboardVisibleRef.current) {
      isKeyboardVisibleRef.current = isKeyboardVisible

      setKeyboardState({
        isVisible: isKeyboardVisible,
        height: isKeyboardVisible ? heightDifference : 0,
        viewportHeight: currentHeight,
      })
    } else if (isKeyboardVisible) {
      // Update height even if keyboard is already visible (e.g., keyboard size changes)
      setKeyboardState({
        isVisible: true,
        height: heightDifference,
        viewportHeight: currentHeight,
      })
    }
  }, [])

  // Scroll an element into view, accounting for keyboard
  const scrollIntoView = useCallback((element: HTMLElement, offset: number = 20) => {
    if (!element || !window.visualViewport) {
      return
    }

    requestAnimationFrame(() => {
      const visualViewport = window.visualViewport!
      const rect = element.getBoundingClientRect()

      // Calculate if element is below visible area (covered by keyboard)
      const elementBottom = rect.bottom
      const visibleBottom = visualViewport.height

      if (elementBottom > visibleBottom) {
        // Element is covered by keyboard, scroll it into view
        const scrollAmount = elementBottom - visibleBottom + offset

        // Find scrollable parent
        let scrollableParent = element.parentElement
        while (scrollableParent) {
          const overflowY = window.getComputedStyle(scrollableParent).overflowY
          if (overflowY === 'auto' || overflowY === 'scroll') {
            scrollableParent.scrollTop += scrollAmount
            break
          }
          scrollableParent = scrollableParent.parentElement
        }

        // Fallback to window scroll if no scrollable parent found
        if (!scrollableParent) {
          window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!window.visualViewport) {
      // Visual Viewport API not supported, likely desktop browser
      return
    }

    const visualViewport = window.visualViewport
    initialHeightRef.current = window.innerHeight

    // Listen to visual viewport resize (happens when keyboard shows/hides)
    visualViewport.addEventListener('resize', handleViewportResize)
    visualViewport.addEventListener('scroll', handleViewportResize)

    // Initial check
    handleViewportResize()

    return () => {
      visualViewport.removeEventListener('resize', handleViewportResize)
      visualViewport.removeEventListener('scroll', handleViewportResize)
    }
  }, [handleViewportResize])

  // Auto-scroll focused inputs into view
  useEffect(() => {
    if (!keyboardState.isVisible) {
      return
    }

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement

      // Only handle input elements
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.contentEditable === 'true'
      ) {
        // Small delay to let keyboard fully appear
        setTimeout(() => {
          scrollIntoView(target)
        }, 300)
      }
    }

    document.addEventListener('focusin', handleFocus, true)

    return () => {
      document.removeEventListener('focusin', handleFocus, true)
    }
  }, [keyboardState.isVisible, scrollIntoView])

  return {
    ...keyboardState,
    scrollIntoView,
  }
}
