import React, { useState } from 'react'
import useTrussStore from '../store/useTrussStore'
import { PRESET_TRUSSES, loadPreset } from '../data/presetTrusses'

const PresetSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('')
  
  const clearAll = useTrussStore((state) => state.clearAll)
  const addNode = useTrussStore((state) => state.addNode)
  const addMember = useTrussStore((state) => state.addMember)
  const runAnalysis = useTrussStore((state) => state.runAnalysis)

  const handleLoadPreset = (presetName) => {
    if (loadPreset(presetName, clearAll, addNode, addMember)) {
      setSelectedPreset(presetName)
      setIsOpen(false)
      
      // Run analysis after a short delay to ensure rendering is complete
      setTimeout(() => {
        runAnalysis()
      }, 100)
    }
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-xl">
      <h3 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
        🎯 Preset Templates
      </h3>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg transition-all duration-200 flex items-center justify-between border border-white/10 hover:border-white/20"
      >
        <span className="font-medium">{selectedPreset || 'Select a preset template...'}</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-2 bg-black/40 backdrop-blur-sm rounded-lg overflow-hidden shadow-xl border border-white/10">
          {PRESET_TRUSSES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleLoadPreset(preset.name)}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all duration-200 border-b border-white/5 last:border-b-0 group"
            >
              <div className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                {preset.name}
              </div>
              <div className="text-xs text-gray-400 mt-1 group-hover:text-gray-300 transition-colors">
                {preset.description}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-white/10">
        <p className="text-xs text-gray-300">
          <span className="font-bold text-green-400">💡 Tip:</span> Load presets to explore common truss designs. 
          Each is optimized for a 20ft span.
        </p>
      </div>
    </div>
  )
}

export default PresetSelector