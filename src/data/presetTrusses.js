import { generateUUID } from '../utils/uuid'

/**
 * Preset truss configurations
 * All coordinates are in pixels (50 pixels = 1 foot)
 * Presets are designed to fit within a 20ft span (1000 pixels)
 */

// Helper function to create a preset with proper IDs
const createPreset = (name, description, nodes, members) => {
  // Generate IDs for nodes
  const nodeMap = new Map()
  const nodesWithIds = nodes.map((node, index) => {
    const id = generateUUID()
    nodeMap.set(index, id)
    return {
      ...node,
      id,
      label: String.fromCharCode(65 + index) // A, B, C, etc.
    }
  })

  // Map member start/end indices to node IDs
  const membersWithIds = members.map(member => ({
    id: generateUUID(),
    start: nodeMap.get(member.startIndex),
    end: nodeMap.get(member.endIndex),
    area: 5.25, // 2x4 actual area
    momentOfInertia: 5.36, // 2x4 moment of inertia
    force: 0
  }))

  return {
    name,
    description,
    nodes: nodesWithIds,
    members: membersWithIds
  }
}

// Define presets centered at x=400 (8ft), with 20ft span (x=150 to x=650)
export const PRESET_TRUSSES = [
  createPreset(
    'King Post',
    'Simple triangular truss with center vertical member',
    [
      { x: 150, y: 400, support: 'fixed' },    // A - Left support
      { x: 650, y: 400, support: 'roller' },   // B - Right support
      { x: 400, y: 250 },                      // C - Top center
      { x: 400, y: 400 }                       // D - Bottom center
    ],
    [
      { startIndex: 0, endIndex: 2 }, // A-C
      { startIndex: 2, endIndex: 1 }, // C-B
      { startIndex: 0, endIndex: 3 }, // A-D
      { startIndex: 3, endIndex: 1 }, // D-B
      { startIndex: 2, endIndex: 3 }  // C-D (king post)
    ]
  ),

  createPreset(
    'Queen Post',
    'Triangular truss with two vertical members',
    [
      { x: 150, y: 400, support: 'fixed' },    // A - Left support
      { x: 650, y: 400, support: 'roller' },   // B - Right support
      { x: 400, y: 250 },                      // C - Top center
      { x: 275, y: 400 },                      // D - Left quarter
      { x: 525, y: 400 },                      // E - Right quarter
      { x: 275, y: 325 },                      // F - Left upper
      { x: 525, y: 325 }                       // G - Right upper
    ],
    [
      { startIndex: 0, endIndex: 5 }, // A-F
      { startIndex: 5, endIndex: 2 }, // F-C
      { startIndex: 2, endIndex: 6 }, // C-G
      { startIndex: 6, endIndex: 1 }, // G-B
      { startIndex: 0, endIndex: 3 }, // A-D
      { startIndex: 3, endIndex: 4 }, // D-E
      { startIndex: 4, endIndex: 1 }, // E-B
      { startIndex: 5, endIndex: 3 }, // F-D (left queen post)
      { startIndex: 6, endIndex: 4 }, // G-E (right queen post)
      { startIndex: 5, endIndex: 6 }  // F-G (top chord)
    ]
  ),

  createPreset(
    'Fink (W-Truss)',
    'W-shaped web configuration for longer spans',
    [
      { x: 150, y: 400, support: 'fixed' },    // A - Left support
      { x: 650, y: 400, support: 'roller' },   // B - Right support
      { x: 275, y: 325 },                      // C - Left lower peak
      { x: 400, y: 250 },                      // D - Center peak
      { x: 525, y: 325 },                      // E - Right lower peak
      { x: 275, y: 400 },                      // F - Left bottom
      { x: 525, y: 400 }                       // G - Right bottom
    ],
    [
      { startIndex: 0, endIndex: 2 }, // A-C
      { startIndex: 2, endIndex: 3 }, // C-D
      { startIndex: 3, endIndex: 4 }, // D-E
      { startIndex: 4, endIndex: 1 }, // E-B
      { startIndex: 0, endIndex: 5 }, // A-F
      { startIndex: 5, endIndex: 6 }, // F-G
      { startIndex: 6, endIndex: 1 }, // G-B
      { startIndex: 2, endIndex: 5 }, // C-F
      { startIndex: 3, endIndex: 5 }, // D-F
      { startIndex: 3, endIndex: 6 }, // D-G
      { startIndex: 4, endIndex: 6 }  // E-G
    ]
  ),

  createPreset(
    'Howe Truss',
    'Similar to King Post but with diagonal web members',
    [
      { x: 150, y: 400, support: 'fixed' },    // A - Left support
      { x: 650, y: 400, support: 'roller' },   // B - Right support
      { x: 400, y: 250 },                      // C - Top center
      { x: 275, y: 400 },                      // D - Left quarter
      { x: 525, y: 400 },                      // E - Right quarter
      { x: 275, y: 325 },                      // F - Left upper
      { x: 525, y: 325 }                       // G - Right upper
    ],
    [
      { startIndex: 0, endIndex: 5 }, // A-F
      { startIndex: 5, endIndex: 2 }, // F-C
      { startIndex: 2, endIndex: 6 }, // C-G
      { startIndex: 6, endIndex: 1 }, // G-B
      { startIndex: 0, endIndex: 3 }, // A-D
      { startIndex: 3, endIndex: 4 }, // D-E
      { startIndex: 4, endIndex: 1 }, // E-B
      { startIndex: 5, endIndex: 3 }, // F-D (vertical)
      { startIndex: 6, endIndex: 4 }, // G-E (vertical)
      { startIndex: 3, endIndex: 2 }, // D-C (diagonal)
      { startIndex: 2, endIndex: 4 }  // C-E (diagonal)
    ]
  ),

  createPreset(
    'Simple Beam',
    'Horizontal beam with supports (for testing deflection)',
    [
      { x: 150, y: 400, support: 'fixed' },    // A - Left support
      { x: 650, y: 400, support: 'roller' },   // B - Right support
      { x: 275, y: 400 },                      // C
      { x: 400, y: 400 },                      // D
      { x: 525, y: 400 }                       // E
    ],
    [
      { startIndex: 0, endIndex: 2 }, // A-C
      { startIndex: 2, endIndex: 3 }, // C-D
      { startIndex: 3, endIndex: 4 }, // D-E
      { startIndex: 4, endIndex: 1 }  // E-B
    ]
  ),

  createPreset(
    'Pratt Truss',
    'Vertical members in compression, diagonals in tension',
    [
      { x: 150, y: 400, support: 'fixed' },    // A - Left support
      { x: 650, y: 400, support: 'roller' },   // B - Right support
      { x: 275, y: 325 },                      // C - Left top
      { x: 400, y: 250 },                      // D - Center top
      { x: 525, y: 325 },                      // E - Right top
      { x: 275, y: 400 },                      // F - Left bottom
      { x: 400, y: 400 },                      // G - Center bottom
      { x: 525, y: 400 }                       // H - Right bottom
    ],
    [
      { startIndex: 0, endIndex: 2 }, // A-C
      { startIndex: 2, endIndex: 3 }, // C-D
      { startIndex: 3, endIndex: 4 }, // D-E
      { startIndex: 4, endIndex: 1 }, // E-B
      { startIndex: 0, endIndex: 5 }, // A-F
      { startIndex: 5, endIndex: 6 }, // F-G
      { startIndex: 6, endIndex: 7 }, // G-H
      { startIndex: 7, endIndex: 1 }, // H-B
      { startIndex: 2, endIndex: 5 }, // C-F (vertical)
      { startIndex: 3, endIndex: 6 }, // D-G (vertical)
      { startIndex: 4, endIndex: 7 }, // E-H (vertical)
      { startIndex: 5, endIndex: 3 }, // F-D (diagonal)
      { startIndex: 6, endIndex: 4 }  // G-E (diagonal)
    ]
  )
]

// Function to load a preset into the store
export const loadPreset = (presetName, clearAll, addNode, addMember) => {
  const preset = PRESET_TRUSSES.find(p => p.name === presetName)
  if (!preset) return false

  // Clear existing structure
  clearAll()

  // Add nodes
  preset.nodes.forEach(node => {
    addNode(node)
  })

  // Add members
  preset.members.forEach(member => {
    addMember(member)
  })

  return true
}