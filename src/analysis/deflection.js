// Deflection calculation using virtual work method
export function calculateDeflections(nodes, members, memberForces, material, nodeForces = []) {
  const deflections = new Map()
  
  // Initialize all node deflections to zero
  nodes.forEach(node => {
    deflections.set(node.id, { dx: 0, dy: 0 })
  })
  
  // For each free node (not a support), calculate deflection
  nodes.forEach(node => {
    if (!node.support) {
      // Calculate vertical deflection using simplified approach
      // This is a simplified method - real analysis would use stiffness matrix
      const nodeDeflection = calculateNodeDeflection(
        node, 
        nodes, 
        members, 
        memberForces, 
        material.E,
        nodeForces
      )
      deflections.set(node.id, nodeDeflection)
    }
  })
  
  // Find maximum deflection
  let maxDeflection = 0
  let maxDeflectionNode = null
  
  deflections.forEach((defl, nodeId) => {
    const totalDefl = Math.sqrt(defl.dx ** 2 + defl.dy ** 2)
    if (totalDefl > maxDeflection) {
      maxDeflection = totalDefl
      maxDeflectionNode = nodeId
    }
  })
  
  return {
    nodeDeflections: Array.from(deflections.entries()).map(([nodeId, defl]) => ({
      nodeId,
      id: nodeId, // Include both for compatibility
      dx: defl.dx,
      dy: defl.dy
    })),
    maxDeflection,
    maxDeflectionNode
  }
}

function calculateNodeDeflection(node, allNodes, members, memberForces, E, nodeForces) {
  let dx = 0
  let dy = 0
  
  // Find members connected to this node
  const connectedMembers = members.filter(m => 
    m.start === node.id || m.end === node.id
  )
  
  // For each connected member, calculate contribution to deflection
  connectedMembers.forEach(member => {
    const force = memberForces.find(f => f.id === member.id)?.force || 0
    
    // Get member geometry
    const startNode = allNodes.find(n => n.id === member.start)
    const endNode = allNodes.find(n => n.id === member.end)
    
    const L = getMemberLengthInches(startNode, endNode)
    const A = member.area // sq in
    const I = member.momentOfInertia || 5.36 // Default to 2x4 if not specified
    
    // Calculate axial deformation: δ = FL/EA
    const axialDeformation = (force * L) / (E * A)
    
    // For members in compression, consider buckling effects
    // More realistic buckling factor based on Euler buckling
    const r = Math.sqrt(I / A) // radius of gyration
    const slendernessRatio = L / r
    // Euler buckling amplification for compression members
    const bucklingFactor = force < 0 ? 1 + Math.pow(slendernessRatio / 200, 2) : 1
    
    // Get direction from this node to other node
    const otherNode = node.id === member.start ? endNode : startNode
    const dirX = otherNode.x - node.x
    const dirY = otherNode.y - node.y
    const length = Math.sqrt(dirX ** 2 + dirY ** 2)
    
    // Add contribution to node deflection
    if (length > 0) {
      // Use actual deformation without reduction factor
      const nodeContribution = axialDeformation * bucklingFactor
      dx += nodeContribution * (dirX / length)
      dy += nodeContribution * (dirY / length)
    }
  })
  
  // Add gravity effect for loaded nodes
  // Find if this node has external load applied
  const nodeForce = nodeForces.find(f => f.nodeId === node.id)
  if (nodeForce && nodeForce.fy < 0) { // Downward load
    // Add bending deflection for loaded nodes
    // This accounts for local member bending under load
    const loadMagnitude = Math.abs(nodeForce.fy)
    // Find the average I of connected members
    const avgI = connectedMembers.reduce((sum, m) => sum + (m.momentOfInertia || 5.36), 0) / connectedMembers.length
    // Approximate local bending deflection: PL³/(48EI) for distributed load
    const avgLength = connectedMembers.reduce((sum, m) => {
      const start = allNodes.find(n => n.id === m.start)
      const end = allNodes.find(n => n.id === m.end)
      return sum + getMemberLengthInches(start, end)
    }, 0) / connectedMembers.length
    
    // More accurate bending deflection for point load on beam
    // Using δ = PL³/(48EI) for midspan loading
    const bendingEffect = (loadMagnitude * Math.pow(avgLength, 3)) / (48 * E * avgI)
    dy -= bendingEffect * 0.5 // Factor accounts for load distribution and continuity
  }
  
  return { dx, dy }
}

function getMemberLengthInches(startNode, endNode) {
  const dx = endNode.x - startNode.x
  const dy = endNode.y - startNode.y
  // Convert pixels to inches: 50 pixels = 1 foot = 12 inches
  return Math.sqrt(dx ** 2 + dy ** 2) * 12 / 50
}

// Calculate deflection limits per IBC
export function checkDeflectionLimits(maxDeflection, span, isRoof = true) {
  // Convert span from pixels to feet (assuming ~50 pixels per foot)
  const spanFeet = span / 50
  const spanInches = spanFeet * 12
  
  const limits = {
    liveLoad: isRoof ? spanInches / 240 : spanInches / 360,
    totalLoad: isRoof ? spanInches / 180 : spanInches / 240
  }
  
  // Calculate actual deflection ratio
  const actualRatio = maxDeflection > 0 ? spanInches / maxDeflection : 999999
  const passes = maxDeflection <= limits.liveLoad
  
  return {
    passes,
    maxAllowable: limits.liveLoad,
    ratio: `L/${Math.floor(actualRatio)}`,
    limitRatio: isRoof ? 'L/240' : 'L/360'
  }
}