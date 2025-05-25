import { create } from 'zustand'
import { analyzeTruss, calculateStress } from '../analysis/trussAnalysis'
import { calculateDeflections, checkDeflectionLimits } from '../analysis/deflection'
import { generateUUID } from '../utils/uuid'
import { defaultLumberSize } from '../data/lumberSizes'

const useTrussStore = create((set, get) => ({
  // Truss geometry - start with empty structure
  nodes: [],
  members: [],
  
  // Loads
  loads: {
    dead: 15,  // psf
    live: 40,  // psf
    snow: 0,   // psf
  },
  
  // Material properties
  material: {
    name: 'SPF (Spruce-Pine-Fir) #2',
    E: 1_200_000,  // psi
    Fb: 775,       // psi
    Fc: 1150,      // psi
    density: 26    // pcf
  },
  
  // Lumber size
  lumberSize: defaultLumberSize,
  
  // Analysis results
  analysisResults: {
    memberForces: [],
    nodeDisplacements: [],
    maxStress: 0,
    maxDeflection: 0,
    status: 'NOT_ANALYZED',
    failures: []
  },
  
  // Actions
  updateLoads: (loads) => set({ loads }),
  
  updateMaterial: (material) => set({ material }),
  
  updateLumberSize: (lumberSize) => set((state) => ({
    lumberSize,
    // Update all existing members with new lumber properties
    members: state.members.map(member => ({
      ...member,
      area: lumberSize.area,
      momentOfInertia: lumberSize.momentOfInertia
    }))
  })),
  
  addNode: (node) => set((state) => {
    // Check if a node already exists at this position
    const existingNode = state.nodes.find(n => 
      Math.abs(n.x - node.x) < 1 && Math.abs(n.y - node.y) < 1
    )
    
    if (existingNode) {
      console.warn('Node already exists at this position')
      return state // Don't add duplicate
    }
    
    return {
      nodes: [...state.nodes, { ...node, id: node.id || generateUUID() }]
    }
  }),
  
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map(node => 
      node.id === id ? { ...node, ...updates } : node
    )
  })),
  
  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter(node => node.id !== id),
    members: state.members.filter(member => 
      member.start !== id && member.end !== id
    )
  })),
  
  toggleNodeSupport: (id, supportType) => set((state) => ({
    nodes: state.nodes.map(node => {
      if (node.id !== id) return node
      
      // Cycle through: none -> fixed -> roller -> none
      let newSupport = null
      if (!node.support) {
        newSupport = supportType || 'fixed'
      } else if (node.support === 'fixed') {
        newSupport = 'roller'
      } else {
        newSupport = null
      }
      
      return { ...node, support: newSupport }
    })
  })),
  
  addMember: (member) => set((state) => {
    // Check if member already exists between these nodes
    const exists = state.members.some(m => 
      (m.start === member.start && m.end === member.end) ||
      (m.start === member.end && m.end === member.start)
    )
    
    if (exists) {
      console.warn('Member already exists between these nodes')
      return state
    }
    
    const newMember = { 
      ...member, 
      id: member.id || generateUUID(), 
      force: 0,
      area: state.lumberSize.area,
      momentOfInertia: state.lumberSize.momentOfInertia
    }
    return {
      members: [...state.members, newMember]
    }
  }),
  
  deleteMember: (id) => set((state) => ({
    members: state.members.filter(member => member.id !== id)
  })),
  
  setAnalysisResults: (results) => set({ analysisResults: results }),
  
  // Getters
  getTrussSpan: () => {
    const nodes = get().nodes
    const xCoords = nodes.map(n => n.x)
    const span = Math.max(...xCoords) - Math.min(...xCoords)
    console.log('Truss span calculation:', span, 'pixels =', span/50, 'feet')
    return span
  },
  
  getTrussHeight: () => {
    const nodes = get().nodes
    const yCoords = nodes.map(n => n.y)
    return Math.max(...yCoords) - Math.min(...yCoords)
  },
  
  // Analysis action
  runAnalysis: () => {
    const state = get()
    try {
      // Run structural analysis
      const results = analyzeTruss(
        state.nodes,
        state.members,
        state.loads,
        state.getTrussSpan()
      )
      
      console.log('Analysis results:', results)
      console.log('Member forces:', results.memberForces)
      
      // Update member forces
      const updatedMembers = state.members.map(member => {
        const forceResult = results.memberForces.find(f => f.id === member.id)
        console.log(`Member ${member.id}: force = ${forceResult ? forceResult.force : 0}`)
        return {
          ...member,
          force: forceResult ? forceResult.force : 0
        }
      })
      
      // Calculate stresses
      const memberStresses = updatedMembers.map(member => ({
        memberId: member.id,
        stress: calculateStress(member.force, member.area),
        force: member.force
      }))
      
      // Find max stress and calculate ratio based on type of force
      let maxStressRatio = 0
      // let criticalMember = null
      const failedMembers = []
      
      memberStresses.forEach(ms => {
        const member = updatedMembers.find(m => m.id === ms.memberId)
        const allowableStress = member.force > 0 ? state.material.Fb : state.material.Fc
        const ratio = ms.stress / allowableStress
        
        if (ratio > 1) {
          failedMembers.push(member.id)
        }
        
        if (ratio > maxStressRatio) {
          maxStressRatio = ratio
          // criticalMember = member
        }
      })
      
      const maxStress = Math.max(...memberStresses.map(m => m.stress))
      
      // Calculate deflections
      const deflectionResults = calculateDeflections(
        state.nodes,
        updatedMembers,
        results.memberForces,
        state.material
      )
      
      // Check deflection limits
      const deflectionCheck = checkDeflectionLimits(
        deflectionResults.maxDeflection,
        state.getTrussSpan(),
        true // isRoof
      )
      
      // Determine overall status
      const failures = []
      if (maxStressRatio > 1) failures.push('Member overstressed')
      if (!deflectionCheck.passes) failures.push(`Deflection exceeds limit (${deflectionCheck.ratio} > ${deflectionCheck.limitRatio})`)
      
      set({
        members: updatedMembers,
        analysisResults: {
          memberForces: results.memberForces,
          nodeDisplacements: deflectionResults.nodeDeflections,
          maxStress,
          maxDeflection: deflectionResults.maxDeflection,
          deflectionRatio: deflectionCheck.ratio,
          status: failures.length > 0 ? 'FAILED' : 'PASSED',
          failures,
          reactions: results.reactions,
          stressRatio: maxStressRatio,
          deflectionCheck,
          failedMembers
        }
      })
    } catch (error) {
      console.error('Analysis failed:', error)
      set({
        analysisResults: {
          ...state.analysisResults,
          status: 'ERROR',
          failures: [error.message]
        }
      })
    }
  },
  
  // Clear all nodes and members, reset analysis
  clearAll: () => set({
    nodes: [],
    members: [],
    analysisResults: {
      memberForces: [],
      nodeDisplacements: [],
      maxStress: 0,
      maxDeflection: 0,
      status: 'NOT_ANALYZED',
      failures: [],
      failedMembers: []
    }
  })
}))

export default useTrussStore