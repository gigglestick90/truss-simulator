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
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 400, y: 350 },                      // C - Top center
      { x: 400, y: 200 }                       // D - Bottom center
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
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 400, y: 350 },                      // C - Top center
      { x: 275, y: 200 },                      // D - Left quarter
      { x: 525, y: 200 },                      // E - Right quarter
      { x: 275, y: 275 },                      // F - Left upper
      { x: 525, y: 275 }                       // G - Right upper
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
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 275, y: 275 },                      // C - Left lower peak
      { x: 400, y: 350 },                      // D - Center peak
      { x: 525, y: 275 },                      // E - Right lower peak
      { x: 275, y: 200 },                      // F - Left bottom
      { x: 525, y: 200 }                       // G - Right bottom
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
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 400, y: 350 },                      // C - Top center
      { x: 275, y: 200 },                      // D - Left quarter
      { x: 525, y: 200 },                      // E - Right quarter
      { x: 275, y: 275 },                      // F - Left upper
      { x: 525, y: 275 }                       // G - Right upper
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
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 275, y: 200 },                      // C
      { x: 400, y: 200 },                      // D
      { x: 525, y: 200 }                       // E
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
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 275, y: 275 },                      // C - Left top
      { x: 400, y: 350 },                      // D - Center top
      { x: 525, y: 275 },                      // E - Right top
      { x: 275, y: 200 },                      // F - Left bottom
      { x: 400, y: 200 },                      // G - Center bottom
      { x: 525, y: 200 }                       // H - Right bottom
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
  ),

  createPreset(
    'Warren Truss',
    'Alternating diagonal members without verticals',
    [
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 275, y: 275 },                      // C - Left top
      { x: 400, y: 350 },                      // D - Center top
      { x: 525, y: 275 },                      // E - Right top
      { x: 275, y: 200 },                      // F - Left bottom
      { x: 400, y: 200 },                      // G - Center bottom
      { x: 525, y: 200 }                       // H - Right bottom
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
      { startIndex: 2, endIndex: 5 }, // C-F (diagonal down)
      { startIndex: 5, endIndex: 3 }, // F-D (diagonal up)
      { startIndex: 3, endIndex: 7 }, // D-H (diagonal down)
      { startIndex: 7, endIndex: 4 }  // H-E (diagonal up)
    ]
  ),

  createPreset(
    'Scissor Truss',
    'Creates vaulted ceiling space with crossed members',
    [
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 250, y: 300 },                      // C - Left mid
      { x: 400, y: 400 },                      // D - Center peak
      { x: 550, y: 300 },                      // E - Right mid
      { x: 300, y: 250 },                      // F - Lower left
      { x: 500, y: 250 }                       // G - Lower right
    ],
    [
      { startIndex: 0, endIndex: 2 }, // A-C
      { startIndex: 2, endIndex: 3 }, // C-D
      { startIndex: 3, endIndex: 4 }, // D-E
      { startIndex: 4, endIndex: 1 }, // E-B
      { startIndex: 0, endIndex: 5 }, // A-F (bottom chord)
      { startIndex: 5, endIndex: 6 }, // F-G (bottom chord)
      { startIndex: 6, endIndex: 1 }, // G-B (bottom chord)
      { startIndex: 2, endIndex: 6 }, // C-G (scissor)
      { startIndex: 4, endIndex: 5 }  // E-F (scissor)
    ]
  ),

  createPreset(
    'Fan Truss',
    'Radiating members from supports for uniform load distribution',
    [
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 275, y: 300 },                      // C
      { x: 400, y: 350 },                      // D - Top center
      { x: 525, y: 300 },                      // E
      { x: 275, y: 200 },                      // F - Bottom
      { x: 400, y: 200 },                      // G - Bottom center
      { x: 525, y: 200 }                       // H - Bottom
    ],
    [
      { startIndex: 0, endIndex: 2 }, // A-C (fan)
      { startIndex: 0, endIndex: 3 }, // A-D (fan)
      { startIndex: 0, endIndex: 5 }, // A-F (bottom)
      { startIndex: 2, endIndex: 3 }, // C-D (top)
      { startIndex: 3, endIndex: 4 }, // D-E (top)
      { startIndex: 1, endIndex: 4 }, // B-E (fan)
      { startIndex: 1, endIndex: 3 }, // B-D (fan)
      { startIndex: 1, endIndex: 7 }, // B-H (bottom)
      { startIndex: 5, endIndex: 6 }, // F-G (bottom)
      { startIndex: 6, endIndex: 7 }, // G-H (bottom)
      { startIndex: 2, endIndex: 5 }, // C-F (vertical)
      { startIndex: 3, endIndex: 6 }, // D-G (vertical)
      { startIndex: 4, endIndex: 7 }  // E-H (vertical)
    ]
  ),

  createPreset(
    'Bowstring Truss',
    'Curved top chord with vertical hangers',
    [
      { x: 150, y: 200, support: 'fixed' },    // A - Left support
      { x: 650, y: 200, support: 'roller' },   // B - Right support
      { x: 225, y: 280 },                      // C - Curve 1
      { x: 300, y: 340 },                      // D - Curve 2
      { x: 400, y: 375 },                      // E - Top center
      { x: 500, y: 340 },                      // F - Curve 3
      { x: 575, y: 280 },                      // G - Curve 4
      { x: 225, y: 200 },                      // H - Bottom
      { x: 300, y: 200 },                      // I - Bottom
      { x: 400, y: 200 },                      // J - Bottom
      { x: 500, y: 200 },                      // K - Bottom
      { x: 575, y: 200 }                       // L - Bottom
    ],
    [
      { startIndex: 0, endIndex: 2 }, // A-C (curve)
      { startIndex: 2, endIndex: 3 }, // C-D (curve)
      { startIndex: 3, endIndex: 4 }, // D-E (curve)
      { startIndex: 4, endIndex: 5 }, // E-F (curve)
      { startIndex: 5, endIndex: 6 }, // F-G (curve)
      { startIndex: 6, endIndex: 1 }, // G-B (curve)
      { startIndex: 0, endIndex: 7 }, // A-H (bottom)
      { startIndex: 7, endIndex: 8 }, // H-I (bottom)
      { startIndex: 8, endIndex: 9 }, // I-J (bottom)
      { startIndex: 9, endIndex: 10 }, // J-K (bottom)
      { startIndex: 10, endIndex: 11 }, // K-L (bottom)
      { startIndex: 11, endIndex: 1 }, // L-B (bottom)
      { startIndex: 2, endIndex: 7 }, // C-H (hanger)
      { startIndex: 3, endIndex: 8 }, // D-I (hanger)
      { startIndex: 4, endIndex: 9 }, // E-J (hanger)
      { startIndex: 5, endIndex: 10 }, // F-K (hanger)
      { startIndex: 6, endIndex: 11 }  // G-L (hanger)
    ]
  ),

  createPreset(
    'Cantilever Truss',
    'Extends beyond support for overhanging structures',
    [
      { x: 50, y: 250 },                       // A - Left cantilever tip
      { x: 150, y: 300 },                      // B - Left top
      { x: 300, y: 200, support: 'fixed' },    // C - Left support
      { x: 500, y: 200, support: 'roller' },   // D - Right support
      { x: 650, y: 300 },                      // E - Right top
      { x: 750, y: 250 },                      // F - Right cantilever tip
      { x: 400, y: 350 },                      // G - Center peak
      { x: 150, y: 200 },                      // H - Bottom left
      { x: 400, y: 200 },                      // I - Bottom center
      { x: 650, y: 200 }                       // J - Bottom right
    ],
    [
      { startIndex: 0, endIndex: 1 }, // A-B (cantilever)
      { startIndex: 1, endIndex: 6 }, // B-G (top chord)
      { startIndex: 6, endIndex: 4 }, // G-E (top chord)
      { startIndex: 4, endIndex: 5 }, // E-F (cantilever)
      { startIndex: 0, endIndex: 7 }, // A-H (bottom cant)
      { startIndex: 7, endIndex: 2 }, // H-C (bottom)
      { startIndex: 2, endIndex: 8 }, // C-I (bottom)
      { startIndex: 8, endIndex: 3 }, // I-D (bottom)
      { startIndex: 3, endIndex: 9 }, // D-J (bottom)
      { startIndex: 9, endIndex: 5 }, // J-F (bottom cant)
      { startIndex: 1, endIndex: 7 }, // B-H (vertical)
      { startIndex: 1, endIndex: 2 }, // B-C (diagonal)
      { startIndex: 6, endIndex: 8 }, // G-I (vertical)
      { startIndex: 4, endIndex: 3 }, // E-D (diagonal)
      { startIndex: 4, endIndex: 9 }  // E-J (vertical)
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