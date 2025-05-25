import React, { useEffect, useState } from 'react'

const ValidationMessage = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onClose) onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible || !message) return null

  const typeClasses = {
    error: 'bg-red-600 text-white',
    warning: 'bg-yellow-600 text-white',
    success: 'bg-green-600 text-white',
    info: 'bg-blue-600 text-white'
  }

  const icons = {
    error: '❌',
    warning: '⚠️',
    success: '✅',
    info: 'ℹ️'
  }

  return (
    <div 
      className={`
        fixed top-20 left-1/2 transform -translate-x-1/2 z-50
        px-4 py-2 rounded-lg shadow-lg
        flex items-center gap-2
        animate-fade-in-down
        ${typeClasses[type]}
      `}
    >
      <span className="text-lg">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
      {duration === 0 && (
        <button
          onClick={() => {
            setIsVisible(false)
            if (onClose) onClose()
          }}
          className="ml-2 text-white hover:text-gray-200"
        >
          ×
        </button>
      )}
    </div>
  )
}

export default ValidationMessage