import React from 'react'
import useTrussStore from '../store/useTrussStore'

const LoadPanel = () => {
  const loads = useTrussStore((state) => state.loads)
  const updateLoads = useTrussStore((state) => state.updateLoads)
  const runAnalysis = useTrussStore((state) => state.runAnalysis)
  
  const handleLoadChange = (loadType, value) => {
    updateLoads({
      ...loads,
      [loadType]: parseFloat(value)
    })
  }
  
  const handleAnalyze = () => {
    runAnalysis()
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 space-y-6 border border-white/10 shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
        🏋️ Load Controls
      </h3>
      
      {/* Dead Load */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/5">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <span className="text-lg">🏗️</span> Dead Load
          </label>
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
            {loads.dead} psf
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="25"
          step="1"
          value={loads.dead}
          onChange={(e) => handleLoadChange('dead', e.target.value)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>10 psf</span>
          <span className="text-gray-500">← Min</span>
          <span>Max →</span>
          <span>25 psf</span>
        </div>
        <div className="mt-2 text-xs space-y-1">
          <p className="text-gray-500">
            <span className="font-semibold text-gray-400">Typical ranges:</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-green-400">•</span>
            <span><span className="text-green-400 font-semibold">10-15 psf:</span> Asphalt shingles, wood framing</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-yellow-400">•</span>
            <span><span className="text-yellow-400 font-semibold">15-20 psf:</span> Heavy shingles, insulation</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-red-400">•</span>
            <span><span className="text-red-400 font-semibold">20-25 psf:</span> Clay/concrete tiles</span>
          </p>
        </div>
      </div>
      
      {/* Live Load */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/5">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <span className="text-lg">👥</span> Live Load
          </label>
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            {loads.live} psf
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={loads.live}
          onChange={(e) => handleLoadChange('live', e.target.value)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0 psf</span>
          <span className="text-gray-500">← Min</span>
          <span>Max →</span>
          <span>100 psf</span>
        </div>
        <div className="mt-2 text-xs space-y-1">
          <p className="text-gray-500">
            <span className="font-semibold text-gray-400">Code requirements & typical uses:</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-blue-400">•</span>
            <span><span className="text-blue-400 font-semibold">20 psf:</span> Minimum roof live load (IBC)</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-green-400">•</span>
            <span><span className="text-green-400 font-semibold">20-40 psf:</span> Typical residential roofs</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-yellow-400">•</span>
            <span><span className="text-yellow-400 font-semibold">40-60 psf:</span> Roof terraces, assembly areas</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-red-400">•</span>
            <span><span className="text-red-400 font-semibold">60-100 psf:</span> Heavy use, mechanical equipment</span>
          </p>
        </div>
      </div>
      
      {/* Snow Load */}
      <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/5">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <span className="text-lg">❄️</span> Snow Load
          </label>
          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            {loads.snow} psf
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="50"
          step="5"
          value={loads.snow}
          onChange={(e) => handleLoadChange('snow', e.target.value)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>0 psf</span>
          <span className="text-gray-500">← None</span>
          <span>Heavy →</span>
          <span>50 psf</span>
        </div>
        <div className="mt-2 text-xs space-y-1">
          <p className="text-gray-500">
            <span className="font-semibold text-gray-400">Regional variations (ground snow × 0.7):</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-green-400">•</span>
            <span><span className="text-green-400 font-semibold">0 psf:</span> Southern states, no snow zones</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-blue-400">•</span>
            <span><span className="text-blue-400 font-semibold">10-20 psf:</span> Mid-Atlantic, light snow areas</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-yellow-400">•</span>
            <span><span className="text-yellow-400 font-semibold">20-30 psf:</span> Pittsburgh, moderate snow</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-orange-400">•</span>
            <span><span className="text-orange-400 font-semibold">30-40 psf:</span> Northern states, heavy snow</span>
          </p>
          <p className="text-gray-500 flex items-center gap-2">
            <span className="text-red-400">•</span>
            <span><span className="text-red-400 font-semibold">40-50+ psf:</span> Mountain regions, extreme snow</span>
          </p>
        </div>
      </div>
      
      {/* Total Load Display */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex justify-between items-center mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10">
          <span className="text-base font-semibold text-gray-200">Σ Total Load</span>
          <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            {loads.dead + loads.live + loads.snow} psf
          </span>
        </div>
        
        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="text-xl">⚡</span>
            Run Analysis
          </span>
        </button>
      </div>
      
      {/* Quick Reference */}
      <div className="text-xs text-gray-400 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10">
        <p className="font-semibold text-gray-300 mb-1">💡 Quick Tips:</p>
        <p className="text-gray-500">• Test with typical residential loads first (DL: 15, LL: 40, SL: 0-30)</p>
        <p className="text-gray-500">• Increase loads gradually to find failure points</p>
        <p className="text-gray-500">• Snow loads vary greatly by region - check local codes</p>
      </div>
    </div>
  )
}

export default LoadPanel