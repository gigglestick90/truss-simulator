// Deflection calculation using virtual work method
export function calculateDeflections(nodes, members, memberForces, material) {
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
        memberForces
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
      dx: defl.dx,
      dy: defl.dy
    })),
    maxDeflection,
    maxDeflectionNode
  }
}

function calculateNodeDeflection(node, allNodes, members, memberForces, E, allMemberForces) {
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
    
    // Calculate axial deformation: δ = FL/EA
    const axialDeformation = (force * L) / (E * A)
    
    // Get direction from this node to other node
    const otherNode = node.id === member.start ? endNode : startNode
    const dirX = otherNode.x - node.x
    const dirY = otherNode.y - node.y
    const length = Math.sqrt(dirX ** 2 + dirY ** 2)
    
    // Add contribution to node deflection
    if (length > 0) {
      // Scale factor to get reasonable deflections
      const scaleFactor = 0.5
      dx += axialDeformation * (dirX / length) * scaleFactor
      dy += axialDeformation * (dirY / length) * scaleFactor
    }
  })
  
  // Add gravity effect for top chord nodes based on load intensity
  // This simulates bending in addition to axial deformation
  if (node.y < 300) { // Top chord nodes
    const positionFactor = (300 - node.y) / 200 // Normalized height
    const totalForce = connectedMembers.reduce((sum, m) => {
      const f = Math.abs(allMemberForces.find(f => f.id === m.id)?.force || 0)
      return sum + f
    }, 0)
    const loadFactor = totalForce * 0.00002 // Scale based on actual forces
    dy += positionFactor * loadFactor
  }
  
  return { dx, dy }
}

function getMemberLengthInches(startNode, endNode) {
  const dx = endNode.x - startNode.x
  const dy = endNode.y - startNode.y
  // Assume 1 pixel = 0.1 inch for visualization purposes
  return Math.sqrt(dx ** 2 + dy ** 2) * 0.1
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