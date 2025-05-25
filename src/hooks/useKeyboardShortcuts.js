import { useEffect } from 'react'

/**
 * Custom hook for keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key codes to handler functions
 * @param {Array} deps - Dependencies array for the effect
 */
export const useKeyboardShortcuts = (shortcuts, deps = []) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't handle shortcuts when typing in input fields
      if (event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' || 
          event.target.tagName === 'SELECT') {
        return
      }

      const key = event.key.toLowerCase()
      const ctrl = event.ctrlKey
      const shift = event.shiftKey
      const alt = event.altKey

      // Build shortcut key string
      let shortcutKey = ''
      if (ctrl) shortcutKey += 'ctrl+'
      if (shift) shortcutKey += 'shift+'
      if (alt) shortcutKey += 'alt+'
      shortcutKey += key

      // Check for exact key match first
      if (shortcuts[key] && !ctrl && !shift && !alt) {
        event.preventDefault()
        shortcuts[key](event)
        return
      }

      // Check for modifier combinations
      if (shortcuts[shortcutKey]) {
        event.preventDefault()
        shortcuts[shortcutKey](event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, ...deps])
}

// Common keyboard shortcuts
export const SHORTCUTS = {
  ESCAPE: 'escape',
  DELETE: 'delete',
  ENTER: 'enter',
  SPACE: ' ',
  
  // Numbers
  ONE: '1',
  TWO: '2',
  THREE: '3',
  
  // Letters
  B: 'b',
  D: 'd',
  M: 'm',
  F: 'f',
  R: 'r',
  V: 'v',
  
  // With modifiers
  CTRL_Z: 'ctrl+z',
  CTRL_Y: 'ctrl+y',
  CTRL_S: 'ctrl+s',
  CTRL_O: 'ctrl+o',
  CTRL_N: 'ctrl+n'
}