import React from 'react'
import useTrussStore from '../store/useTrussStore'
import { clsx } from 'clsx'

const ResultsPanel = () => {
  const analysisResults = useTrussStore((state) => state.analysisResults)
  const material = useTrussStore((state) => state.material)
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'PASSED':
        return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/50 text-green-400'
      case 'FAILED':
        return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/50 text-red-400'
      case 'ERROR':
        return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50 text-yellow-400'
      default:
        return 'bg-gray-700/20 border-gray-700/50 text-gray-500'
    }
  }
  
  const getStressRatioColor = (ratio) => {
    if (ratio < 0.5) return 'text-green-400'
    if (ratio < 0.8) return 'text-yellow-400'
    if (ratio < 0.95) return 'text-orange-400'
    return 'text-red-400'
  }
  
  const formatNumber = (num) => {
    if (typeof num !== 'number') return '—'
    return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  
  return (
    <>
      {/* Status Banner */}
      <div className={clsx(
        'rounded-xl p-6 border-2 transition-all duration-300 shadow-xl',
        getStatusColor(analysisResults.status)
      )}>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black flex items-center gap-3">
            {analysisResults.status === 'PASSED' && <span>✅</span>}
            {analysisResults.status === 'FAILED' && <span>❌</span>}
            {analysisResults.status === 'ERROR' && <span>⚠️</span>}
            {analysisResults.status === 'NOT_ANALYZED' && <span>🔍</span>}
            {analysisResults.status === 'NOT_ANALYZED' ? 'NOT ANALYZED' : analysisResults.status}
          </span>
          <span className="text-sm text-gray-200 max-w-[200px] text-right">
            {analysisResults.status === 'NOT_ANALYZED' 
              ? 'Run analysis to see results'
              : analysisResults.failures.length > 0 
                ? analysisResults.failures[0]
                : 'All checks passed'
            }
          </span>
        </div>
      </div>
      
      {/* Stress Analysis */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 space-y-4 border border-white/10 shadow-xl">
        <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
          💪 Stress Analysis
        </h3>
        
        {analysisResults.status !== 'NOT_ANALYZED' ? (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Maximum Stress</span>
                <span className="font-mono font-bold text-orange-400">
                  {formatNumber(analysisResults.maxStress)} psi
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Allowable Stress</span>
                <span className="font-mono text-gray-200">
                  {formatNumber(material.Fc)} psi
                </span>
              </div>
              
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300 font-semibold">Stress Ratio</span>
                  <span className={clsx(
                    'font-mono font-black text-2xl',
                    getStressRatioColor(analysisResults.stressRatio || 0)
                  )}>
                    {analysisResults.stressRatio 
                      ? `${(analysisResults.stressRatio * 100).toFixed(1)}%`
                      : '—'
                    }
                  </span>
                </div>
                
                {/* Stress ratio bar */}
                <div className="mt-3 w-full bg-black/30 rounded-full h-3 overflow-hidden">
                  <div 
                    className={clsx(
                      'h-3 rounded-full transition-all duration-500 relative',
                      analysisResults.stressRatio < 0.5 && 'bg-gradient-to-r from-green-400 to-emerald-400',
                      analysisResults.stressRatio >= 0.5 && analysisResults.stressRatio < 0.8 && 'bg-gradient-to-r from-yellow-400 to-amber-400',
                      analysisResults.stressRatio >= 0.8 && analysisResults.stressRatio < 0.95 && 'bg-gradient-to-r from-orange-400 to-red-400',
                      analysisResults.stressRatio >= 0.95 && 'bg-gradient-to-r from-red-500 to-red-600'
                    )}
                    style={{ width: `${Math.min(100, (analysisResults.stressRatio || 0) * 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reactions */}
            {analysisResults.reactions && (
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold text-gray-200 mb-3">⚖️ Support Reactions</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-gray-300">◀️ Left Support</span>
                    <span className="font-mono font-semibold text-blue-400">{formatNumber(analysisResults.reactions.left)} lbs</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white/5 rounded-lg">
                    <span className="text-sm text-gray-300">▶️ Right Support</span>
                    <span className="font-mono font-semibold text-blue-400">{formatNumber(analysisResults.reactions.right)} lbs</span>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center p-8">
            💡 Adjust loads and click "Run Analysis" to see results
          </p>
        )}
      </div>
      
      {/* Deflection */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-5 space-y-4 border border-white/10 shadow-xl">
        <h3 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
          📉 Deflection Analysis
        </h3>
        
        {analysisResults.status !== 'NOT_ANALYZED' && analysisResults.deflectionCheck ? (
          <>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Maximum Deflection</span>
                <span className="font-mono font-bold text-purple-400">
                  {analysisResults.maxDeflection.toFixed(2)}″
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Deflection Ratio</span>
                <span className={clsx(
                  'font-mono font-bold text-lg',
                  analysisResults.deflectionCheck.passes ? 'text-green-400' : 'text-red-400'
                )}>
                  {analysisResults.deflectionRatio}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Allowable Limit</span>
                <span className="font-mono text-gray-200">
                  {analysisResults.deflectionCheck.limitRatio}
                </span>
              </div>
            </div>
            
            {/* Deflection status */}
            <div className={clsx(
              'text-sm p-3 rounded-lg font-semibold text-center',
              analysisResults.deflectionCheck.passes 
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30'
            )}>
              {analysisResults.deflectionCheck.passes 
                ? '✅ Deflection within limits' 
                : '❌ Excessive deflection'
              }
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center p-8">
            📊 Run analysis to see deflection results
          </p>
        )}
      </div>
    </>
  )
}

export default ResultsPanel