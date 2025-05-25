/**
 * Save/Load utilities for truss designs
 */

// Current file format version
const FILE_VERSION = '1.0.0'

/**
 * Export current truss design to JSON
 */
export function exportTrussDesign(nodes, members, loads, material, lumberSize) {
  const design = {
    version: FILE_VERSION,
    metadata: {
      createdAt: new Date().toISOString(),
      name: 'Truss Design',
      description: '',
      software: 'Truss Simulator'
    },
    structure: {
      nodes: nodes.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        label: node.label,
        support: node.support || null
      })),
      members: members.map(member => ({
        id: member.id,
        start: member.start,
        end: member.end,
        area: member.area,
        momentOfInertia: member.momentOfInertia
      }))
    },
    parameters: {
      loads: { ...loads },
      material: {
        name: material.name,
        E: material.E,
        Fb: material.Fb,
        Fc: material.Fc,
        density: material.density
      },
      lumberSize: lumberSize ? {
        name: lumberSize.name,
        actualWidth: lumberSize.actualWidth,
        actualHeight: lumberSize.actualHeight,
        area: lumberSize.area,
        momentOfInertia: lumberSize.momentOfInertia,
        weight: lumberSize.weight
      } : null
    }
  }

  return design
}

/**
 * Import truss design from JSON
 */
export function importTrussDesign(jsonData) {
  try {
    const design = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
    
    // Validate version
    if (!design.version) {
      throw new Error('Invalid file format: missing version')
    }
    
    // Validate structure
    if (!design.structure || !design.structure.nodes || !design.structure.members) {
      throw new Error('Invalid file format: missing structure data')
    }
    
    return {
      nodes: design.structure.nodes,
      members: design.structure.members,
      loads: design.parameters?.loads || { dead: 15, live: 40, snow: 0 },
      material: design.parameters?.material || null,
      lumberSize: design.parameters?.lumberSize || null,
      metadata: design.metadata || {}
    }
  } catch (error) {
    throw new Error(`Failed to import design: ${error.message}`)
  }
}

/**
 * Download design as JSON file
 */
export function downloadDesign(nodes, members, loads, material, lumberSize, filename = 'truss-design.json') {
  const design = exportTrussDesign(nodes, members, loads, material, lumberSize)
  const jsonString = JSON.stringify(design, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Load design from file
 */
export function loadDesignFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      try {
        const jsonData = event.target.result
        const design = importTrussDesign(jsonData)
        resolve(design)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }
    
    reader.readAsText(file)
  })
}