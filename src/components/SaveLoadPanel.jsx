import React, { useRef, useState } from 'react'
import useTrussStore from '../store/useTrussStore'
import { downloadDesign, loadDesignFromFile } from '../utils/saveLoad'
import ValidationMessage from './ValidationMessage'

const SaveLoadPanel = () => {
  const fileInputRef = useRef(null)
  const [message, setMessage] = useState(null)
  
  // Get store data and actions
  const nodes = useTrussStore((state) => state.nodes)
  const members = useTrussStore((state) => state.members)
  const loads = useTrussStore((state) => state.loads)
  const material = useTrussStore((state) => state.material)
  const lumberSize = useTrussStore((state) => state.lumberSize)
  const clearAll = useTrussStore((state) => state.clearAll)
  const addNode = useTrussStore((state) => state.addNode)
  const addMember = useTrussStore((state) => state.addMember)
  const updateLoads = useTrussStore((state) => state.updateLoads)
  const updateMaterial = useTrussStore((state) => state.updateMaterial)
  const updateLumberSize = useTrussStore((state) => state.updateLumberSize)
  const runAnalysis = useTrussStore((state) => state.runAnalysis)

  const handleSave = () => {
    if (nodes.length === 0) {
      setMessage({ text: 'No truss to save!', type: 'warning' })
      return
    }
    
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
    const filename = `truss-design-${timestamp}.json`
    
    try {
      downloadDesign(nodes, members, loads, material, lumberSize, filename)
      setMessage({ text: 'Design saved successfully!', type: 'success' })
    } catch {
      setMessage({ text: 'Failed to save design', type: 'error' })
    }
  }

  const handleLoad = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    try {
      const design = await loadDesignFromFile(file)
      
      // Clear existing design
      clearAll()
      
      // Load nodes
      design.nodes.forEach(node => {
        addNode(node)
      })
      
      // Load members
      design.members.forEach(member => {
        addMember(member)
      })
      
      // Load parameters
      if (design.loads) {
        updateLoads(design.loads)
      }
      
      if (design.material) {
        updateMaterial(design.material)
      }
      
      if (design.lumberSize) {
        updateLumberSize(design.lumberSize)
      }
      
      setMessage({ text: 'Design loaded successfully!', type: 'success' })
      
      // Run analysis after loading
      setTimeout(() => {
        runAnalysis()
      }, 100)
      
    } catch (error) {
      setMessage({ text: error.message, type: 'error' })
    }
    
    // Reset file input
    event.target.value = ''
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-xl">
      <h3 className="text-xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
        💾 Save/Load Design
      </h3>
      
      <div className="space-y-3">
        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save Design
        </button>
        
        {/* Load Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Load Design
        </button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleLoad}
          className="hidden"
        />
      </div>
      
      <div className="mt-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-white/10">
        <p className="text-xs text-gray-300">
          <span className="font-bold text-yellow-400">📄 Note:</span> Saves complete design including structure, loads & materials as JSON.
        </p>
      </div>
      
      {/* Validation Message */}
      {message && (
        <ValidationMessage
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
    </div>
  )
}

export default SaveLoadPanel