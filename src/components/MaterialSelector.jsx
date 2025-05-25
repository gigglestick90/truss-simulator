import React from 'react'
import useTrussStore from '../store/useTrussStore'
import { WOOD_SPECIES } from '../data/materials'

const MaterialSelector = () => {
  const material = useTrussStore((state) => state.material)
  const updateMaterial = useTrussStore((state) => state.updateMaterial)
  const runAnalysis = useTrussStore((state) => state.runAnalysis)
  const analysisResults = useTrussStore((state) => state.analysisResults)
  
  const handleMaterialChange = (e) => {
    const selectedMaterial = e.target.value
    updateMaterial({
      name: selectedMaterial,
      ...WOOD_SPECIES[selectedMaterial]
    })
    
    // Re-run analysis if we have results
    if (analysisResults.status !== 'NOT_ANALYZED') {
      setTimeout(() => runAnalysis(), 100)
    }
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-4 border border-white/10 shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
        🌲 Material Properties
      </h3>
      
      {/* Material Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-200">Wood Species</label>
        <select
          value={material.name}
          onChange={handleMaterialChange}
          className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all hover:bg-black/40"
        >
          {Object.keys(WOOD_SPECIES).map(species => (
            <option key={species} value={species}>
              {species}
            </option>
          ))}
        </select>
      </div>
      
      {/* Material Properties Display */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="space-y-3">
          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <span className="text-blue-400">📊</span> Elasticity
            </span>
            <span className="font-mono text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              {(material.E / 1000000).toFixed(1)}M psi
            </span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <span className="text-orange-400">💪</span> Bending (Fb)
            </span>
            <span className="font-mono text-sm font-semibold text-orange-400">
              {material.Fb.toLocaleString()} psi
            </span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <span className="text-purple-400">🗜️</span> Compression (Fc)
            </span>
            <span className="font-mono text-sm font-semibold text-purple-400">
              {material.Fc.toLocaleString()} psi
            </span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
            <span className="text-sm text-gray-300 flex items-center gap-2">
              <span className="text-green-400">⚖️</span> Density
            </span>
            <span className="font-mono text-sm font-semibold text-green-400">
              {material.density} pcf
            </span>
          </div>
        </div>
        
        {/* Strength Comparison Bar */}
        <div className="pt-4">
          <div className="text-xs text-gray-400 mb-2">Relative Strength (psi)</div>
          <div className="space-y-1">
            {Object.entries(WOOD_SPECIES).map(([species, props]) => {
              // Create short labels for each species
              const getShortName = (name) => {
                if (name.includes('Hem-Fir')) return 'Hem-Fir'
                if (name.includes('Douglas')) return 'Doug Fir'
                if (name.includes('Southern')) return 'So. Pine'
                if (name.includes('SPF')) return 'SPF'
                return name
              }
              
              return (
                <div key={species} className="flex items-center gap-2">
                  <span className="text-xs w-16 text-right" title={species}>
                    {getShortName(species)}
                  </span>
                  <div className="flex-1 bg-black/30 rounded-full h-2 relative overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        species === material.name 
                          ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-lg shadow-emerald-500/50' 
                          : 'bg-gray-600'
                      }`}
                      style={{ width: `${(props.Fc / 1650) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12">
                    {props.Fc}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Info Text */}
      <div className="text-xs text-gray-400 space-y-1 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg border border-white/10">
        <p className="flex items-center gap-2">
          <span className="text-blue-400">•</span>
          <span className="font-semibold">E:</span> Stiffness (higher = less sag)
        </p>
        <p className="flex items-center gap-2">
          <span className="text-orange-400">•</span>
          <span className="font-semibold">Fb:</span> Bending resistance
        </p>
        <p className="flex items-center gap-2">
          <span className="text-purple-400">•</span>
          <span className="font-semibold">Fc:</span> Compression strength
        </p>
      </div>
    </div>
  )
}

export default MaterialSelector