import { useState } from 'react'
import TrussCanvasClean from './components/TrussCanvasClean'
import LoadPanel from './components/LoadPanel'
import ResultsPanel from './components/ResultsPanel'
import MaterialSelector from './components/MaterialSelector'
import PresetSelector from './components/PresetSelector'
import SaveLoadPanel from './components/SaveLoadPanel'
import GridSettings from './components/GridSettings'
import useTrussStore from './store/useTrussStore'

function App() {
  // Grid settings state
  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(50)
  const [isBuilderMode, setIsBuilderMode] = useState(false)
  const [builderTool, setBuilderTool] = useState('member')
  
  const clearAll = useTrussStore((state) => state.clearAll)
  
  const handleClearAll = () => {
    if (confirm('Clear all nodes and members?')) {
      clearAll()
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>
      
      <div className="relative flex h-screen overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-80 bg-black/30 backdrop-blur-xl border-r border-white/10 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-blue-600 to-purple-600">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <span className="text-4xl">🏗️</span>
              Truss Simulator
            </h1>
            <p className="text-sm text-blue-100 mt-1">Interactive Structural Analysis</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* Load Panel */}
            <LoadPanel />
            
            {/* Material Selector */}
            <MaterialSelector />
            
            {/* Preset Selector */}
            <PresetSelector />
            
            {/* Save/Load Panel */}
            <SaveLoadPanel />
          </div>
        </div>

        {/* Center - Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-4">
            <div className="relative w-full h-full bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-30 blur-xl"></div>
              
              {/* Canvas container with proper constraints */}
              <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <TrussCanvasClean 
                  gridSettings={{
                    showGrid,
                    gridSize,
                    setGridSize,
                    isBuilderMode,
                    builderTool
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Results */}
        <div className="w-96 bg-black/30 backdrop-blur-xl border-l border-white/10 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-purple-600 to-pink-600">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Analysis Results
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            <ResultsPanel />
            
            {/* Grid Settings */}
            <GridSettings
              showGrid={showGrid}
              setShowGrid={setShowGrid}
              gridSize={gridSize}
              setGridSize={setGridSize}
              isBuilderMode={isBuilderMode}
              setIsBuilderMode={setIsBuilderMode}
              builderTool={builderTool}
              setBuilderTool={setBuilderTool}
              onClearAll={handleClearAll}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App