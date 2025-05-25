// Method of Joints solver for truss analysis
export function analyzeTruss(nodes, members, loads, trussSpan) {
  // Convert nodes and members to analysis format
  // const nodeMap = new Map(nodes.map(n => [n.id, n]))
  
  // Calculate total load on truss
  // Convert psf to plf (pounds per linear foot) based on tributary width
  // Assuming 2 ft spacing between trusses
  const tributaryWidth = 2 // feet
  const uniformLoad = (loads.dead + loads.live + loads.snow) * tributaryWidth // plf
  
  // Find support nodes
  const supports = nodes.filter(n => n.support)
  if (supports.length < 2) {
    throw new Error("Truss must have at least 2 supports for stability")
  }
  
  console.log('Truss analysis starting:')
  console.log('- Nodes:', nodes.length)
  console.log('- Members:', members.length)
  console.log('- Supports:', supports.length)
  
  // Find leftmost and rightmost supports
  const leftSupport = supports.reduce((prev, curr) => prev.x < curr.x ? prev : curr)
  const rightSupport = supports.reduce((prev, curr) => prev.x > curr.x ? prev : curr)
  
  // Calculate span in feet from pixels
  const spanFeet = trussSpan / 50 // Assume 50 pixels per foot
  
  // For uniform load, reactions are equal
  const reactionForce = (uniformLoad * spanFeet) / 2
  
  // Initialize node forces
  const nodeForces = new Map()
  nodes.forEach(node => {
    nodeForces.set(node.id, { fx: 0, fy: 0 })
  })
  
  // Apply support reactions
  if (leftSupport) nodeForces.get(leftSupport.id).fy = reactionForce
  if (rightSupport) nodeForces.get(rightSupport.id).fy = reactionForce
  
  // Find the topmost Y coordinate (smallest Y value since Y increases downward)
  const nonSupportNodes = nodes.filter(n => !n.support)
  
  if (nonSupportNodes.length === 0) {
    throw new Error("No non-support nodes found to apply loads")
  }
  
  const minY = Math.min(...nonSupportNodes.map(n => n.y))
  
  // Apply distributed load to top chord nodes (nodes at or near the top)
  // Consider nodes within 50 pixels (1 foot) of the top as part of the top chord
  const topNodes = nonSupportNodes.filter(n => n.y <= minY + 50)
  
  console.log('Load application debug:')
  console.log('- Total load:', uniformLoad * spanFeet, 'lbs')
  console.log('- Span:', spanFeet, 'ft')
  console.log('- Top nodes found:', topNodes.length)
  console.log('- Top nodes:', topNodes.map(n => `${n.label || n.id} at y=${n.y}`))
  
  if (topNodes.length > 0) {
    const loadPerNode = -(uniformLoad * spanFeet) / topNodes.length
    console.log('- Load per top node:', loadPerNode, 'lbs')
    topNodes.forEach(node => {
      nodeForces.get(node.id).fy += loadPerNode
    })
  } else {
    // If no clear top chord, distribute to all non-support nodes
    const loadPerNode = -(uniformLoad * spanFeet) / nonSupportNodes.length
    console.log('- No top chord found, load per node:', loadPerNode, 'lbs')
    nonSupportNodes.forEach(node => {
      nodeForces.get(node.id).fy += loadPerNode
    })
  }
  
  // Solve for member forces using Method of Joints
  const memberForces = solveMemberForces(nodes, members, nodeForces)
  
  console.log('Member forces calculated:', memberForces)
  
  return {
    memberForces,
    reactions: {
      left: reactionForce,
      right: reactionForce
    },
    nodeForces: Array.from(nodeForces.entries()).map(([nodeId, forces]) => ({
      nodeId,
      ...forces
    }))
  }
}

function solveMemberForces(nodes, members, externalForces) {
  const memberForces = new Map()
  const solvedNodes = new Set()
  
  console.log('Solving member forces:')
  console.log('- External forces:', Array.from(externalForces.entries()))
  
  // Initialize all member forces to unknown
  members.forEach(m => memberForces.set(m.id, null))
  
  // Create adjacency list
  const nodeConnections = new Map()
  nodes.forEach(n => nodeConnections.set(n.id, []))
  
  members.forEach(m => {
    if (nodeConnections.has(m.start)) {
      nodeConnections.get(m.start).push(m)
    } else {
      console.warn(`Member ${m.id} references non-existent start node ${m.start}`)
    }
    if (nodeConnections.has(m.end)) {
      nodeConnections.get(m.end).push(m)
    } else {
      console.warn(`Member ${m.id} references non-existent end node ${m.end}`)
    }
  })
  
  // Check for zero-force members (nodes with only 2 collinear members and no external load)
  nodes.forEach(node => {
    const connectedMembers = nodeConnections.get(node.id)
    const externalForce = externalForces.get(node.id)
    
    if (connectedMembers.length === 2 && 
        Math.abs(externalForce.fx) < 1e-10 && 
        Math.abs(externalForce.fy) < 1e-10) {
      // Check if members are collinear
      const [m1, m2] = connectedMembers
      const node1 = nodes.find(n => n.id === (m1.start === node.id ? m1.end : m1.start))
      const node2 = nodes.find(n => n.id === (m2.start === node.id ? m2.end : m2.start))
      
      const dx1 = node1.x - node.x
      const dy1 = node1.y - node.y
      const dx2 = node2.x - node.x
      const dy2 = node2.y - node.y
      
      // Check if vectors are parallel (cross product ≈ 0)
      const cross = Math.abs(dx1 * dy2 - dx2 * dy1)
      if (cross < 1e-10) {
        // Zero-force members
        memberForces.set(m1.id, 0)
        memberForces.set(m2.id, 0)
        solvedNodes.add(node.id)
        console.log(`Node ${node.label || node.id} has zero-force members`)
      }
    }
  })
  
  // Method of Joints - solve nodes with 2 or fewer unknowns
  let progress = true
  let iteration = 0
  const maxIterations = nodes.length * 2
  
  while (progress && solvedNodes.size < nodes.length && iteration < maxIterations) {
    progress = false
    iteration++
    
    for (const node of nodes) {
      if (solvedNodes.has(node.id)) continue
      
      const connectedMembers = nodeConnections.get(node.id)
      const unknownMembers = connectedMembers.filter(m => memberForces.get(m.id) === null)
      
      console.log(`Node ${node.label || node.id}: ${unknownMembers.length} unknowns, ${connectedMembers.length} total members`)
      
      // Can only solve if 2 or fewer unknowns
      if (unknownMembers.length <= 2 && unknownMembers.length > 0) {
        const result = solveNode(node, connectedMembers, memberForces, externalForces.get(node.id), nodes)
        
        if (result) {
          result.forEach(({ memberId, force }) => {
            memberForces.set(memberId, force)
            console.log(`Solved member ${memberId}: force = ${force.toFixed(1)} lbs`)
          })
          solvedNodes.add(node.id)
          progress = true
        }
      }
    }
  }
  
  console.log(`Solver completed after ${iteration} iterations. Solved ${solvedNodes.size}/${nodes.length} nodes.`)
  
  // Convert to array format with proper signs
  return members.map(member => ({
    id: member.id,
    force: memberForces.get(member.id) || 0
  }))
}

function solveNode(node, connectedMembers, currentForces, externalForce, allNodes) {
  // Set up equilibrium equations: ΣFx = 0, ΣFy = 0
  let sumFx = externalForce.fx
  let sumFy = externalForce.fy
  
  const unknowns = []
  
  connectedMembers.forEach(member => {
    const force = currentForces.get(member.id)
    const otherNodeId = member.start === node.id ? member.end : member.start
    const otherNode = allNodes.find(n => n.id === otherNodeId)
    
    // Calculate direction cosines
    const dx = otherNode.x - node.x
    const dy = otherNode.y - node.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const cos = dx / length
    const sin = dy / length
    
    if (force === null) {
      unknowns.push({ member, cos, sin })
    } else {
      // Add known forces (tension positive, compression negative)
      sumFx -= force * cos
      sumFy -= force * sin
    }
  })
  
  // Solve based on number of unknowns
  if (unknowns.length === 0) return null
  
  if (unknowns.length === 1) {
    // One unknown - solve directly
    const { member, cos, sin } = unknowns[0]
    
    // Use the equation with larger coefficient for numerical stability
    let force
    if (Math.abs(cos) > Math.abs(sin)) {
      force = -sumFx / cos
    } else {
      force = -sumFy / sin
    }
    
    return [{ memberId: member.id, force }]
  }
  
  if (unknowns.length === 2) {
    // Two unknowns - solve system of equations
    const [u1, u2] = unknowns
    
    // Solve using determinants
    const det = u1.cos * u2.sin - u2.cos * u1.sin
    if (Math.abs(det) < 1e-10) return null // Singular system
    
    const force1 = (-sumFx * u2.sin + sumFy * u2.cos) / det
    const force2 = (-u1.cos * sumFy + u1.sin * sumFx) / det
    
    return [
      { memberId: u1.member.id, force: force1 },
      { memberId: u2.member.id, force: force2 }
    ]
  }
  
  return null
}

// Helper function to calculate member stress
export function calculateStress(force, area) {
  return Math.abs(force) / area // psi
}

// Helper function to get member length
export function getMemberLength(member, nodes) {
  const start = nodes.find(n => n.id === member.start)
  const end = nodes.find(n => n.id === member.end)
  const dx = end.x - start.x
  const dy = end.y - start.y
  return Math.sqrt(dx * dx + dy * dy) / 12 // Convert pixels to feet
}