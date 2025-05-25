import React from 'react'

const GridSettings = ({ 
  showGrid, 
  setShowGrid, 
  gridSize, 
  setGridSize,
  isBuilderMode,
  setIsBuilderMode,
  builderTool,
  setBuilderTool,
  onClearAll
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 shadow-xl">
      <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
        🎯 Grid & Builder Settings
      </h3>
      
      {/* Grid Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <label className="text-sm font-semibold text-gray-200">Show Grid</label>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showGrid ? 'bg-gradient-to-r from-cyan-500 to-green-500' : 'bg-gray-600'
            }`}
          >
            <span
              className={`${
                showGrid ? 'translate-x-6' : 'translate-x-1'
              } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
            />
          </button>
        </div>
        
        {showGrid && (
          <div className="space-y-3 p-3 bg-white/5 rounded-lg border border-white/5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-gray-200">Grid Size</label>
              <span className="text-sm font-bold text-cyan-400">{gridSize/50}ft</span>
            </div>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 focus:border-cyan-400 focus:outline-none transition-colors"
            >
              <option value={25}>0.5 ft</option>
              <option value={50}>1 ft</option>
              <option value={100}>2 ft</option>
            </select>
          </div>
        )}
      </div>

      {/* Builder Mode */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <button
          onClick={() => setIsBuilderMode(!isBuilderMode)}
          className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 transform hover:scale-105 active:scale-95 ${
            isBuilderMode 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:shadow-xl' 
              : 'bg-white/10 text-gray-200 hover:bg-white/20'
          }`}
        >
          {isBuilderMode ? '🔨 Builder Mode ON' : '👁️ View Mode'}
        </button>
        
        {isBuilderMode && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-bold text-gray-300 uppercase tracking-wide">Select Tool:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setBuilderTool('member')}
                className={`px-3 py-2 text-xs rounded-lg font-semibold transition-all duration-200 ${
                  builderTool === 'member'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                📏 Member
              </button>
              <button
                onClick={() => setBuilderTool('fixed')}
                className={`px-3 py-2 text-xs rounded-lg font-semibold transition-all duration-200 ${
                  builderTool === 'fixed'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                △ Fixed
              </button>
              <button
                onClick={() => setBuilderTool('roller')}
                className={`px-3 py-2 text-xs rounded-lg font-semibold transition-all duration-200 ${
                  builderTool === 'roller'
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg transform scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                ○ Roller
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-white/10">
              <p className="text-xs font-semibold text-gray-200 mb-2">Quick Guide:</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Click empty space → Add node</p>
                <p>• Click nodes → Apply tool</p>
                <p>• Right-click → Delete</p>
                <p>• Drag nodes → Reposition</p>
                {builderTool === 'member' && <p className="text-blue-300 font-semibold">→ Connect two nodes</p>}
                {builderTool === 'fixed' && <p className="text-green-300 font-semibold">→ Add fixed support △</p>}
                {builderTool === 'roller' && <p className="text-cyan-300 font-semibold">→ Add roller support ○</p>}
              </div>
            </div>
            
            <button
              onClick={onClearAll}
              className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white text-sm font-bold rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              🗑️ Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default GridSettings