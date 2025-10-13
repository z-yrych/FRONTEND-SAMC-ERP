import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Plus, Loader2 } from 'lucide-react'
import { useKeyboardAwareViewport } from '../../hooks/useKeyboardAwareViewport'

interface Option {
  id: string
  name: string
}

interface SmartComboBoxProps {
  label: string
  placeholder: string
  options: Option[]
  onSelect: (option: Option) => void
  onCreate?: (name: string) => Promise<Option>
  loading?: boolean
  value?: Option | null
  required?: boolean
  disabled?: boolean
}

export function SmartComboBox({
  label,
  placeholder,
  options,
  onSelect,
  onCreate,
  loading = false,
  value,
  required = false,
  disabled = false
}: SmartComboBoxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { scrollIntoView, isVisible: isKeyboardVisible } = useKeyboardAwareViewport()

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showCreateOption = onCreate && searchQuery &&
    !filteredOptions.some(opt => opt.name.toLowerCase() === searchQuery.toLowerCase())

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: Option) => {
    onSelect(option)
    setSearchQuery(option.name)
    setIsOpen(false)
  }

  const handleCreate = async () => {
    if (!onCreate || !searchQuery) return

    setIsCreating(true)
    try {
      const newOption = await onCreate(searchQuery)
      handleSelect(newOption)
    } catch (error) {
      console.error('Failed to create:', error)
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    if (value) {
      setSearchQuery(value.name)
    }
  }, [value])

  // Scroll dropdown into view when keyboard appears
  useEffect(() => {
    if (isOpen && isKeyboardVisible && inputRef.current) {
      setTimeout(() => {
        scrollIntoView(inputRef.current!, 100)
      }, 100)
    }
  }, [isOpen, isKeyboardVisible, scrollIntoView])

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-600 ml-1">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={(e) => {
            if (!disabled) {
              setIsOpen(true)
              // Select all text to allow easy replacement when changing selection
              e.target.select()
            }
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 && (
            <div>
              {filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100"
                >
                  {option.name}
                </button>
              ))}
            </div>
          )}

          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full px-3 py-2 text-left text-blue-600 hover:bg-blue-50 focus:bg-blue-50 border-t border-gray-200 flex items-center gap-2"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Create "{searchQuery}"
            </button>
          )}

          {filteredOptions.length === 0 && !showCreateOption && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  )
}