import type { LucideIcon } from 'lucide-react'

interface ActionCardProps {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
}

export function ActionCard({ icon: Icon, title, description, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left w-full"
    >
      {/* Icon */}
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
        <Icon className="w-6 h-6" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-600 group-hover:text-gray-700">
        {description}
      </p>

      {/* Hover arrow indicator */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  )
}
