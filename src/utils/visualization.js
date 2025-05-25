// Color interpolation for stress visualization
export function getStressColor(force, maxForce) {
  if (Math.abs(force) < 0.01) return '#888888' // Neutral gray
  
  const ratio = Math.min(Math.abs(force) / Math.abs(maxForce), 1)
  
  if (force > 0) {
    // Tension - interpolate from light red to dark red
    const r = 255
    const g = Math.round(204 * (1 - ratio))
    const b = Math.round(204 * (1 - ratio))
    return `rgb(${r}, ${g}, ${b})`
  } else {
    // Compression - interpolate from light blue to dark blue
    const r = Math.round(204 * (1 - ratio))
    const g = Math.round(204 * (1 - ratio))
    const b = 255
    return `rgb(${r}, ${g}, ${b})`
  }
}

// Get stroke width based on force magnitude
export function getStrokeWidth(force, maxForce) {
  const minWidth = 2
  const maxWidth = 8
  const ratio = Math.min(Math.abs(force) / Math.abs(maxForce), 1)
  return minWidth + (maxWidth - minWidth) * ratio
}

// Format force value for display
export function formatForce(force) {
  const absForce = Math.abs(force)
  if (absForce < 100) return `${force.toFixed(0)} lbs`
  if (absForce < 1000) return `${force.toFixed(0)} lbs`
  return `${(force / 1000).toFixed(1)}k lbs`
}

// Get stress ratio color
export function getStressRatioColor(ratio) {
  if (ratio < 0.5) return '#00ff00' // Safe - green
  if (ratio < 0.8) return '#ffff00' // Caution - yellow
  if (ratio < 0.95) return '#ff8800' // Warning - orange
  return '#ff0000' // Critical - red
}