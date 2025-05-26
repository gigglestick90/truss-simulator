import React, { useRef, useEffect, useState } from 'react'
import { Stage, Layer, Line, Circle, Text, Group, Rect } from 'react-konva'
import Konva from 'konva'
import useTrussStore from '../store/useTrussStore'
import { getStressColor, getStrokeWidth, formatForce } from '../utils/visualization'
import { generateUUID } from '../utils/uuid'

const TrussCanvasClean = ({ gridSettings = {} }) => {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [showForceLabels] = useState(true)
  const [showDeflection, setShowDeflection] = useState(false)
  const [deflectionScale, setDeflectionScale] = useState(100)
  const showGrid = gridSettings.showGrid ?? true
  const [hoveredNode, setHoveredNode] = useState(null)
  const isBuilderMode = gridSettings.isBuilderMode ?? false
  const [animationProgress, setAnimationProgress] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pulsePhase, setPulsePhase] = useState(0)
  const [isDrawingMember, setIsDrawingMember] = useState(false)
  const [drawingStart, setDrawingStart] = useState(null)
  const [ghostNode, setGhostNode] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const builderTool = gridSettings.builderTool ?? 'member'
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState(null)
  const memberRefs = useRef({})
  const animationRef = useRef(null)
  const pulseAnimationRef = useRef(null)
  const stageRef = useRef(null)
  
  // Zoom state
  const [stageScale, setStageScale] = useState(1)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [showZoomIndicator, setShowZoomIndicator] = useState(false)
  const zoomTimeoutRef = useRef(null)
  
  // Grid dimensions from props
  const gridDimensions = gridSettings.gridDimensions || { width: 50, height: 30 }
  const GRID_SPACING = 1 // 1 foot grid spacing
  const PIXELS_PER_FOOT = 50
  
  // Calculate scale to fit grid in canvas with padding
  const PADDING = 60
  const [scale, setScale] = useState(1)
  const [gridOrigin, setGridOrigin] = useState({ x: 0, y: 0 })
  
  const nodes = useTrussStore((state) => state.nodes)
  const members = useTrussStore((state) => state.members)
  const analysisResults = useTrussStore((state) => state.analysisResults)
  const addNode = useTrussStore((state) => state.addNode)
  const addMember = useTrussStore((state) => state.addMember)
  const deleteNode = useTrussStore((state) => state.deleteNode)
  const deleteMember = useTrussStore((state) => state.deleteMember)
  const toggleNodeSupport = useTrussStore((state) => state.toggleNodeSupport)
  const updateNode = useTrussStore((state) => state.updateNode)
  
  // Calculate scale and origin when dimensions or grid size changes
  useEffect(() => {
    const gridWidthPx = gridDimensions.width * PIXELS_PER_FOOT
    const gridHeightPx = gridDimensions.height * PIXELS_PER_FOOT
    
    const scaleX = (dimensions.width - PADDING * 2) / gridWidthPx
    const scaleY = (dimensions.height - PADDING * 2) / gridHeightPx
    const newScale = Math.min(scaleX, scaleY, 1) // Don't scale up, only down
    
    // Center the grid
    const scaledWidth = gridWidthPx * newScale
    const scaledHeight = gridHeightPx * newScale
    const originX = (dimensions.width - scaledWidth) / 2
    const originY = (dimensions.height - scaledHeight) / 2
    
    setScale(newScale)
    setGridOrigin({ x: originX, y: originY })
  }, [dimensions, gridDimensions])
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  useEffect(() => {
    if (analysisResults.status === 'PASSED' || analysisResults.status === 'FAILED') {
      startForceFlowAnimation()
    }
  }, [analysisResults.status])
  
  useEffect(() => {
    if (analysisResults.failedMembers?.length > 0) {
      startPulseAnimation()
    } else {
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current)
        setPulsePhase(0)
      }
    }
    return () => {
      if (pulseAnimationRef.current) {
        cancelAnimationFrame(pulseAnimationRef.current)
      }
    }
  }, [analysisResults.failedMembers])
  
  const startForceFlowAnimation = () => {
    setIsAnimating(true)
    setAnimationProgress(0)
    
    const startTime = Date.now()
    const duration = 2000
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      setAnimationProgress(progress)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        setAnimationProgress(1)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }
  
  const startPulseAnimation = () => {
    const animate = () => {
      setPulsePhase(prev => (prev + 0.02) % 1)
      pulseAnimationRef.current = requestAnimationFrame(animate)
    }
    pulseAnimationRef.current = requestAnimationFrame(animate)
  }
  
  // Convert world coordinates to screen coordinates
  const worldToScreen = (x, y) => {
    return {
      x: gridOrigin.x + x * scale,
      y: gridOrigin.y + (gridDimensions.height * PIXELS_PER_FOOT - y) * scale
    }
  }
  
  // Convert screen coordinates to world coordinates (accounting for zoom)
  const screenToWorld = (x, y) => {
    // First account for stage zoom and position
    const stageX = (x - stagePosition.x) / stageScale
    const stageY = (y - stagePosition.y) / stageScale
    
    // Then convert to world coordinates
    return {
      x: (stageX - gridOrigin.x) / scale,
      y: (gridOrigin.y + gridDimensions.height * PIXELS_PER_FOOT * scale - stageY) / scale
    }
  }
  
  // Snap to grid (only when grid is shown)
  const snapToGrid = (x, y) => {
    if (!showGrid) {
      return { x, y }
    }
    const gridSizePx = GRID_SPACING * PIXELS_PER_FOOT
    return {
      x: Math.round(x / gridSizePx) * gridSizePx,
      y: Math.round(y / gridSizePx) * gridSizePx
    }
  }
  
  // Check if point is within grid bounds
  const isWithinBounds = (x, y) => {
    const worldX = x / PIXELS_PER_FOOT
    const worldY = y / PIXELS_PER_FOOT
    return worldX >= 0 && worldX <= gridDimensions.width && 
           worldY >= 0 && worldY <= gridDimensions.height
  }
  
  const maxForce = Math.max(...members.map(m => Math.abs(m.force)), 0.1)
  
  const getDeflectedPosition = (node) => {
    if (!showDeflection || analysisResults.status === 'NOT_ANALYZED') {
      return worldToScreen(node.x, node.y)
    }
    
    const nodeResult = analysisResults.nodeDeflections?.find(n => n.nodeId === node.id)
    if (!nodeResult) {
      return worldToScreen(node.x, node.y)
    }
    
    // Convert deflection from inches to pixels (50 pixels = 12 inches)
    const inchesToPixels = PIXELS_PER_FOOT / 12
    const deflectedX = node.x + (nodeResult.dx * inchesToPixels * deflectionScale / 100)
    const deflectedY = node.y + (nodeResult.dy * inchesToPixels * deflectionScale / 100)
    
    return worldToScreen(deflectedX, deflectedY)
  }
  
  const renderBackground = () => {
    const bgWidth = gridDimensions.width * PIXELS_PER_FOOT * scale
    const bgHeight = gridDimensions.height * PIXELS_PER_FOOT * scale
    
    return (
      <Group>
        <Rect
          x={gridOrigin.x}
          y={gridOrigin.y}
          width={bgWidth}
          height={bgHeight}
          fill="#111827"
          opacity={0.3}
        />
        <Rect
          x={gridOrigin.x}
          y={gridOrigin.y}
          width={bgWidth}
          height={bgHeight}
          stroke="#3b82f6"
          strokeWidth={2}
          fill="transparent"
          opacity={0.5}
        />
      </Group>
    )
  }
  
  const renderGrid = () => {
    if (!showGrid) return null
    
    const elements = []
    const width = gridDimensions.width * PIXELS_PER_FOOT * scale
    const height = gridDimensions.height * PIXELS_PER_FOOT * scale
    
    // Vertical lines
    for (let i = 0; i <= gridDimensions.width; i += GRID_SPACING) {
      const x = gridOrigin.x + i * PIXELS_PER_FOOT * scale
      const isMajor = i % 5 === 0
      
      elements.push(
        <Line
          key={`v-${i}`}
          points={[x, gridOrigin.y, x, gridOrigin.y + height]}
          stroke={isMajor ? "#4b5563" : "#1f2937"}
          strokeWidth={isMajor ? 2 : 0.5}
          opacity={isMajor ? 0.8 : 0.3}
          dash={isMajor ? undefined : [2, 4]}
        />
      )
    }
    
    // Horizontal lines
    for (let i = 0; i <= gridDimensions.height; i += GRID_SPACING) {
      const y = gridOrigin.y + height - i * PIXELS_PER_FOOT * scale
      const isMajor = i % 5 === 0
      
      elements.push(
        <Line
          key={`h-${i}`}
          points={[gridOrigin.x, y, gridOrigin.x + width, y]}
          stroke={isMajor ? "#4b5563" : "#1f2937"}
          strokeWidth={isMajor ? 2 : 0.5}
          opacity={isMajor ? 0.8 : 0.3}
          dash={isMajor ? undefined : [2, 4]}
        />
      )
    }
    
    return <Group>{elements}</Group>
  }
  
  const renderAxisLabels = () => {
    const labels = []
    const labelSpacing = 5 // Every 5 feet
    
    // X-axis labels
    for (let i = 0; i <= gridDimensions.width; i += labelSpacing) {
      const x = gridOrigin.x + i * PIXELS_PER_FOOT * scale
      labels.push(
        <Text
          key={`x-${i}`}
          x={x - 15}
          y={gridOrigin.y + gridDimensions.height * PIXELS_PER_FOOT * scale + 10}
          text={`${i}`}
          fontSize={11}
          fontFamily="Atkinson Hyperlegible"
          fill="#9ca3af"
          align="center"
          width={30}
        />
      )
    }
    
    // Y-axis labels
    for (let i = 0; i <= gridDimensions.height; i += labelSpacing) {
      const y = gridOrigin.y + (gridDimensions.height - i) * PIXELS_PER_FOOT * scale
      labels.push(
        <Text
          key={`y-${i}`}
          x={gridOrigin.x - 30}
          y={y - 7}
          text={`${i}`}
          fontSize={11}
          fontFamily="Atkinson Hyperlegible"
          fill="#9ca3af"
          align="right"
          width={25}
        />
      )
    }
    
    // Axis labels
    labels.push(
      <Text
        key="x-label"
        x={gridOrigin.x + gridDimensions.width * PIXELS_PER_FOOT * scale / 2 - 20}
        y={gridOrigin.y + gridDimensions.height * PIXELS_PER_FOOT * scale + 30}
        text="X (ft)"
        fontSize={12}
        fontFamily="Atkinson Hyperlegible"
        fill="#e5e7eb"
        fontStyle="bold"
      />
    )
    
    labels.push(
      <Text
        key="y-label"
        x={gridOrigin.x - 50}
        y={gridOrigin.y + gridDimensions.height * PIXELS_PER_FOOT * scale / 2 - 10}
        text="Y (ft)"
        fontSize={12}
        fontFamily="Atkinson Hyperlegible"
        fill="#e5e7eb"
        fontStyle="bold"
      />
    )
    
    return labels
  }
  
  const renderSnapIndicator = () => {
    if (!isDragging || !draggedNodeId || !showGrid) return null
    
    const node = nodes.find(n => n.id === draggedNodeId)
    if (!node) return null
    
    const snapped = snapToGrid(node.x, node.y)
    const screenPos = worldToScreen(snapped.x, snapped.y)
    
    return (
      <Group opacity={0.5}>
        <Line
          points={[screenPos.x - 15, screenPos.y, screenPos.x + 15, screenPos.y]}
          stroke="#60a5fa"
          strokeWidth={1}
        />
        <Line
          points={[screenPos.x, screenPos.y - 15, screenPos.x, screenPos.y + 15]}
          stroke="#60a5fa"
          strokeWidth={1}
        />
      </Group>
    )
  }
  
  const renderGhostNode = () => {
    if (!isBuilderMode || !ghostNode || isDrawingMember) return null
    
    const screenPos = worldToScreen(ghostNode.x, ghostNode.y)
    
    return (
      <Group opacity={0.5}>
        <Circle
          x={screenPos.x}
          y={screenPos.y}
          radius={6}
          fill="#60a5fa"
          stroke="#3b82f6"
          strokeWidth={2}
        />
        <Text
          x={screenPos.x + 10}
          y={screenPos.y - 20}
          text={`(${(ghostNode.x / PIXELS_PER_FOOT).toFixed(1)}, ${(ghostNode.y / PIXELS_PER_FOOT).toFixed(1)})`}
          fontSize={10}
          fontFamily="Atkinson Hyperlegible"
          fill="#60a5fa"
        />
      </Group>
    )
  }
  
  const renderDrawingMember = () => {
    if (!isDrawingMember || !drawingStart || !mousePos) return null
    
    const startScreen = worldToScreen(drawingStart.x, drawingStart.y)
    const endWorld = screenToWorld(mousePos.x, mousePos.y)
    const endSnapped = snapToGrid(endWorld.x, endWorld.y)
    const endScreen = worldToScreen(endSnapped.x, endSnapped.y)
    
    const dx = endSnapped.x - drawingStart.x
    const dy = endSnapped.y - drawingStart.y
    const length = Math.sqrt(dx * dx + dy * dy) / PIXELS_PER_FOOT
    
    return (
      <Group>
        <Line
          points={[startScreen.x, startScreen.y, endScreen.x, endScreen.y]}
          stroke="#60a5fa"
          strokeWidth={2}
          opacity={0.7}
          dash={[5, 5]}
        />
        <Text
          x={(startScreen.x + endScreen.x) / 2 - 30}
          y={(startScreen.y + endScreen.y) / 2 - 20}
          text={`${length.toFixed(2)} ft`}
          fontSize={12}
          fontFamily="Atkinson Hyperlegible"
          fill="#60a5fa"
          align="center"
          width={60}
        />
      </Group>
    )
  }
  
  const renderGhostMembers = () => {
    if (!showDeflection || analysisResults.status === 'NOT_ANALYZED') return null
    
    // Always show ghost members when deflection is on, even if deflection is minimal
    // This shows the original undeflected structure
    return (
      <Group opacity={0.5}>
        {members.map(member => {
          const startNode = nodes.find(n => n.id === member.start)
          const endNode = nodes.find(n => n.id === member.end)
          
          if (!startNode || !endNode) return null
          
          // Always use original positions for ghost members
          const startScreen = worldToScreen(startNode.x, startNode.y)
          const endScreen = worldToScreen(endNode.x, endNode.y)
          
          return (
            <Line
              key={`ghost-${member.id}`}
              points={[startScreen.x, startScreen.y, endScreen.x, endScreen.y]}
              stroke="#00ff88"
              strokeWidth={3}
              opacity={0.7}
              dash={[10, 5]}
              shadowBlur={12}
              shadowColor="#00ff88"
              shadowOpacity={0.8}
            />
          )
        })}
        {nodes.map(node => {
          const screenPos = worldToScreen(node.x, node.y)
          return (
            <Circle
              key={`ghost-node-${node.id}`}
              x={screenPos.x}
              y={screenPos.y}
              radius={4}
              fill="#00ff88"
              opacity={0.7}
              shadowBlur={10}
              shadowColor="#00ff88"
              shadowOpacity={1}
            />
          )
        })}
      </Group>
    )
  }
  
  const renderMembers = () => {
    return members.map((member, index) => {
      const startNode = nodes.find(n => n.id === member.start)
      const endNode = nodes.find(n => n.id === member.end)
      
      if (!startNode || !endNode) return null
      
      const deflectedStart = getDeflectedPosition(startNode)
      const deflectedEnd = getDeflectedPosition(endNode)
      const midX = (deflectedStart.x + deflectedEnd.x) / 2
      const midY = (deflectedStart.y + deflectedEnd.y) / 2
      
      const animatedForce = member.force * animationProgress
      const animatedOpacity = 0.3 + (0.6 * animationProgress)
      const animatedStrokeWidth = isAnimating 
        ? 2 + (getStrokeWidth(member.force, maxForce) - 2) * animationProgress
        : getStrokeWidth(member.force, maxForce)
      
      const memberDelay = index * 0.1
      const memberProgress = Math.max(0, Math.min(1, (animationProgress * 2000 - memberDelay * 1000) / 1000))
      
      const isFailed = analysisResults.failedMembers?.includes(member.id)
      const pulseGlow = Math.sin(pulsePhase * Math.PI * 2) * 0.5 + 0.5
      
      return (
        <Group key={member.id} onClick={(e) => handleMemberClick(member, e)} onTap={(e) => handleMemberClick(member, e)}>
          {isFailed && (
            <Line
              points={[deflectedStart.x, deflectedStart.y, deflectedEnd.x, deflectedEnd.y]}
              stroke="#ff0000"
              strokeWidth={getStrokeWidth(member.force, maxForce) + (pulseGlow * 8)}
              opacity={pulseGlow * 0.6}
              shadowBlur={20 + (pulseGlow * 20)}
              shadowColor="#ff0000"
              lineCap="round"
            />
          )}
          
          {showDeflection && analysisResults.status !== 'NOT_ANALYZED' && (
            <Line
              points={[deflectedStart.x, deflectedStart.y, deflectedEnd.x, deflectedEnd.y]}
              stroke={getStressColor(member.force, maxForce)}
              strokeWidth={getStrokeWidth(member.force, maxForce) + 4}
              opacity={0.3}
              shadowBlur={15}
              shadowColor={getStressColor(member.force, maxForce)}
              lineCap="round"
            />
          )}
          
          <Line
            ref={el => memberRefs.current[member.id] = el}
            points={[deflectedStart.x, deflectedStart.y, deflectedEnd.x, deflectedEnd.y]}
            stroke={isFailed ? '#ff3333' : getStressColor(isAnimating ? animatedForce : member.force, maxForce)}
            strokeWidth={animatedStrokeWidth}
            opacity={isAnimating ? animatedOpacity : (showDeflection ? 1 : 0.9)}
            shadowBlur={isFailed ? 10 + (pulseGlow * 10) : (showDeflection ? 8 : (member.force !== 0 && memberProgress > 0.5 ? 3 + (memberProgress * 5) : 0))}
            shadowColor={isFailed ? '#ff0000' : getStressColor(member.force, maxForce)}
            shadowOpacity={isFailed ? 1 : (showDeflection ? 0.8 : memberProgress)}
          />
          
          {isAnimating && member.force !== 0 && memberProgress > 0 && (
            <Circle
              x={deflectedStart.x + (deflectedEnd.x - deflectedStart.x) * memberProgress}
              y={deflectedStart.y + (deflectedEnd.y - deflectedStart.y) * memberProgress}
              radius={4}
              fill={getStressColor(member.force, maxForce)}
              opacity={1 - memberProgress}
              shadowBlur={10}
              shadowColor={getStressColor(member.force, maxForce)}
            />
          )}
          
          {showForceLabels && analysisResults.status !== 'NOT_ANALYZED' && member.force !== 0 && (
            <Group opacity={isAnimating ? memberProgress : 1}>
              <Text
                x={midX - 30}
                y={midY - 10}
                text={formatForce(member.force)}
                fontSize={12}
                fontFamily="Atkinson Hyperlegible"
                fill="#ffffff"
                stroke="#000000"
                strokeWidth={0.5}
                align="center"
                width={60}
              />
            </Group>
          )}
        </Group>
      )
    })
  }
  
  const renderNodes = () => {
    return nodes.map(node => {
      const deflectedPos = getDeflectedPosition(node)
      const isHovered = hoveredNode === node.id
      
      return (
        <Group key={node.id}>
          {isHovered && (
            <Circle
              x={deflectedPos.x}
              y={deflectedPos.y}
              radius={12}
              fill="#3b82f6"
              opacity={0.3}
              shadowBlur={10}
              shadowColor="#3b82f6"
            />
          )}
          
          {isBuilderMode && isDrawingMember && drawingStart?.id === node.id && (
            <Circle
              x={deflectedPos.x}
              y={deflectedPos.y}
              radius={12}
              stroke="#60a5fa"
              strokeWidth={2}
              fill="transparent"
            />
          )}
          
          <Circle
            x={deflectedPos.x}
            y={deflectedPos.y}
            radius={6}
            fill={node.support ? "#22c55e" : "#3b82f6"}
            stroke={node.support ? "#16a34a" : "#2563eb"}
            strokeWidth={2}
            shadowBlur={node.support ? 10 : 5}
            shadowColor={node.support ? "#22c55e" : "#3b82f6"}
            shadowOpacity={0.5}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={(e) => handleNodeClick(node, e)}
            onTap={(e) => handleNodeClick(node, e)}
            onMouseDown={(e) => handleNodeMouseDown(node, e)}
            onMouseUp={handleNodeMouseUp}
            onDragStart={(e) => {
              if (!isBuilderMode) {
                e.target.stopDrag()
                return
              }
            }}
            onDragMove={(e) => handleNodeDrag(node, e)}
            onDragEnd={(e) => handleNodeDragEnd(node, e)}
            draggable={isBuilderMode && !isDrawingMember}
          />
          
          <Text
            x={deflectedPos.x - 10}
            y={deflectedPos.y - 25}
            text={node.label}
            fontSize={14}
            fontFamily="Atkinson Hyperlegible"
            fontStyle="bold"
            fill="#e5e7eb"
            align="center"
            width={20}
            listening={false}
          />
          
          {isHovered && !isBuilderMode && (
            <Group>
              <Rect
                x={deflectedPos.x + 10}
                y={deflectedPos.y - 50}
                width={160}
                height={node.support ? 65 : 50}
                fill="black"
                opacity={0.8}
                cornerRadius={5}
              />
              <Text
                x={deflectedPos.x + 15}
                y={deflectedPos.y - 45}
                text={`Node ${node.label}`}
                fontSize={12}
                fontFamily="Atkinson Hyperlegible"
                fill="#ffffff"
                fontStyle="bold"
              />
              <Text
                x={deflectedPos.x + 15}
                y={deflectedPos.y - 30}
                text={`Position: (${(node.x / PIXELS_PER_FOOT).toFixed(1)}, ${(node.y / PIXELS_PER_FOOT).toFixed(1)}) ft`}
                fontSize={10}
                fontFamily="Atkinson Hyperlegible"
                fill="#9ca3af"
              />
              {analysisResults.status !== 'NOT_ANALYZED' && (
                <>
                  {(() => {
                    const nodeForce = analysisResults.nodeForces?.find(n => n.nodeId === node.id)
                    const nodeDeflection = analysisResults.nodeDeflections?.find(n => n.nodeId === node.id)
                    return (
                      <>
                        {nodeForce && Math.abs(nodeForce.fy) > 0.1 && (
                          <Text
                            x={deflectedPos.x + 15}
                            y={deflectedPos.y - 15}
                            text={`Force: ${nodeForce.fy.toFixed(0)} lbs ${nodeForce.fy > 0 ? '↑' : '↓'}`}
                            fontSize={10}
                            fontFamily="Atkinson Hyperlegible"
                            fill={nodeForce.fy > 0 ? "#22c55e" : "#ef4444"}
                          />
                        )}
                        {nodeDeflection && (
                          <Text
                            x={deflectedPos.x + 15}
                            y={deflectedPos.y + (node.support ? 0 : -15)}
                            text={`Δ: ${Math.sqrt(nodeDeflection.dx * nodeDeflection.dx + nodeDeflection.dy * nodeDeflection.dy).toFixed(3)}″`}
                            fontSize={10}
                            fontFamily="Atkinson Hyperlegible"
                            fill="#60a5fa"
                          />
                        )}
                      </>
                    )
                  })()}
                </>
              )}
            </Group>
          )}
          
          {node.support === 'fixed' && (
            <Group listening={false}>
              <Line
                points={[
                  deflectedPos.x - 12, deflectedPos.y + 12,
                  deflectedPos.x, deflectedPos.y,
                  deflectedPos.x + 12, deflectedPos.y + 12
                ]}
                stroke="#00ff00"
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
                shadowBlur={8}
                shadowColor="#00ff00"
              />
              <Line
                points={[deflectedPos.x - 15, deflectedPos.y + 12, deflectedPos.x + 15, deflectedPos.y + 12]}
                stroke="#00ff00"
                strokeWidth={3}
                lineCap="round"
              />
            </Group>
          )}
          
          {node.support === 'roller' && (
            <Group listening={false}>
              <Circle
                x={deflectedPos.x}
                y={deflectedPos.y + 18}
                radius={6}
                fill="#00ff00"
                stroke="#00ff00"
                strokeWidth={2}
                opacity={0.8}
                shadowBlur={5}
                shadowColor="#00ff00"
              />
              <Line
                points={[deflectedPos.x - 15, deflectedPos.y + 26, deflectedPos.x + 15, deflectedPos.y + 26]}
                stroke="#00ff00"
                strokeWidth={2}
                opacity={0.8}
              />
            </Group>
          )}
        </Group>
      )
    })
  }
  
  const handleStageClick = (e) => {
    if (!isBuilderMode) return
    if (e.evt.button === 2) return
    
    const pointer = e.target.getStage().getPointerPosition()
    const worldPos = screenToWorld(pointer.x, pointer.y)
    const snapped = snapToGrid(worldPos.x, worldPos.y)
    
    // Check if within bounds
    if (!isWithinBounds(snapped.x, snapped.y)) {
      console.log('Click outside grid bounds')
      return
    }
    
    const clickedNode = nodes.find(n => {
      const dx = n.x - snapped.x
      const dy = n.y - snapped.y
      return Math.sqrt(dx * dx + dy * dy) < PIXELS_PER_FOOT / 2
    })
    
    if (clickedNode) {
      if (isDrawingMember && drawingStart?.id === clickedNode.id) {
        setIsDrawingMember(false)
        setDrawingStart(null)
      } else if (builderTool === 'member') {
        setIsDrawingMember(true)
        setDrawingStart(clickedNode)
      }
    } else {
      if (isDrawingMember) {
        setIsDrawingMember(false)
        setDrawingStart(null)
      } else {
        const newNode = {
          id: generateUUID(),
          x: snapped.x,
          y: snapped.y,
          label: String.fromCharCode(65 + nodes.length),
          support: null
        }
        addNode(newNode)
      }
    }
  }
  
  const handleMouseMove = (e) => {
    const pointer = e.target.getStage().getPointerPosition()
    setMousePos(pointer)
    
    if (isBuilderMode) {
      const worldPos = screenToWorld(pointer.x, pointer.y)
      const snapped = snapToGrid(worldPos.x, worldPos.y)
      if (!isDrawingMember && isWithinBounds(snapped.x, snapped.y)) {
        setGhostNode(snapped)
      } else {
        setGhostNode(null)
      }
    }
  }
  
  const handleWheel = (e) => {
    e.evt.preventDefault()
    
    const scaleBy = 1.1
    const stage = stageRef.current
    if (!stage) return
    
    const oldScale = stage.scaleX()
    const pointer = stage.getPointerPosition()
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    }
    
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    
    // Limit zoom range (50% to 300%)
    const limitedScale = Math.max(0.5, Math.min(3, newScale))
    
    stage.scale({ x: limitedScale, y: limitedScale })
    
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    }
    
    stage.position(newPos)
    setStageScale(limitedScale)
    setStagePosition(newPos)
    
    // Show zoom indicator
    setShowZoomIndicator(true)
    clearTimeout(zoomTimeoutRef.current)
    zoomTimeoutRef.current = setTimeout(() => {
      setShowZoomIndicator(false)
    }, 1500)
  }
  
  const handleNodeClick = (node, e) => {
    if (!isBuilderMode) return
    
    if (e?.cancelBubble !== undefined) {
      e.cancelBubble = true
    }
    
    if (e?.evt?.button === 2) {
      e.evt.preventDefault()
      deleteNode(node.id)
      setIsDrawingMember(false)
      setDrawingStart(null)
      return
    }
    
    if (!e || e?.evt?.button === 0) {
      if (builderTool === 'member') {
        if (isDrawingMember && drawingStart) {
          if (node.id !== drawingStart.id) {
            const memberExists = members.some(m => 
              (m.start === drawingStart.id && m.end === node.id) ||
              (m.start === node.id && m.end === drawingStart.id)
            )
            
            if (!memberExists) {
              addMember({
                id: generateUUID(),
                start: drawingStart.id,
                end: node.id,
                area: 5.5
              })
            }
          }
          
          setIsDrawingMember(false)
          setDrawingStart(null)
        } else {
          setIsDrawingMember(true)
          setDrawingStart(node)
        }
      } else if (builderTool === 'fixed') {
        toggleNodeSupport(node.id, 'fixed')
        if (e && e.cancelBubble !== undefined) {
          e.cancelBubble = true
        }
      } else if (builderTool === 'roller') {
        toggleNodeSupport(node.id, 'roller')
        if (e && e.cancelBubble !== undefined) {
          e.cancelBubble = true
        }
      }
    }
  }
  
  const handleMemberClick = (member, e) => {
    if (!isBuilderMode) return
    
    if (e?.evt?.button === 2) {
      e.evt.preventDefault()
      deleteMember(member.id)
    }
  }
  
  const handleNodeMouseDown = (node, e) => {
    if (!isBuilderMode || isDrawingMember) return
    if (e?.evt?.button !== 0) return
    
    setIsDragging(true)
    setDraggedNodeId(node.id)
  }
  
  const handleNodeMouseUp = () => {
    setIsDragging(false)
    setDraggedNodeId(null)
  }
  
  const handleNodeDrag = (node, e) => {
    if (!isBuilderMode || isDrawingMember) return
    
    const stage = stageRef.current
    const transform = stage.getAbsoluteTransform().copy()
    transform.invert()
    
    const pos = e.target.getAbsolutePosition()
    const stagePos = transform.point(pos)
    
    const worldPos = screenToWorld(stagePos.x, stagePos.y)
    const snapped = snapToGrid(worldPos.x, worldPos.y)
    
    if (isWithinBounds(snapped.x, snapped.y)) {
      updateNode(node.id, { x: snapped.x, y: snapped.y })
    }
  }
  
  const handleNodeDragEnd = (node, e) => {
    handleNodeDrag(node, e)
    setIsDragging(false)
    setDraggedNodeId(null)
  }
  
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <div ref={containerRef} className="absolute inset-0">
        <Stage 
          ref={stageRef}
          width={dimensions.width} 
          height={dimensions.height}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setGhostNode(null)
            setMousePos(null)
          }}
          onContextMenu={(e) => e.evt.preventDefault()}
          onWheel={handleWheel}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
        >
          <Layer>
            {renderBackground()}
            {renderGrid()}
            {renderSnapIndicator()}
            {renderGhostNode()}
            {renderDrawingMember()}
            {renderGhostMembers()}
            {renderMembers()}
            {renderNodes()}
          </Layer>
          <Layer listening={false}>
            {renderAxisLabels()}
          </Layer>
        </Stage>
      </div>
      
      {/* Deflection Controls - Outside of Stage */}
      {analysisResults.status !== 'NOT_ANALYZED' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-2xl border border-white/20">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-200">Show Deflection</label>
            <button
              onClick={() => setShowDeflection(!showDeflection)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showDeflection ? 'bg-purple-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`${
                  showDeflection ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
          
          {showDeflection && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-gray-200">Scale</label>
                <span className="text-sm font-bold text-purple-400">{deflectionScale}x</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={deflectionScale}
                onChange={(e) => setDeflectionScale(Number(e.target.value))}
                className="w-48 h-2 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>10x</span>
                <span className="text-gray-500">100x</span>
                <span>500x</span>
              </div>
            </div>
          )}
          
          <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            Max: {analysisResults.maxDeflection?.toFixed(2)}″
          </div>
        </div>
      )}
      
      {/* Grid Info */}
      <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white font-semibold shadow-lg border border-white/20">
        <span className="text-sm">Canvas: {gridDimensions.width} × {gridDimensions.height} ft</span>
      </div>
      
      {/* Zoom Indicator */}
      {showZoomIndicator && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white font-semibold shadow-lg border border-white/20 transition-opacity duration-300">
          <span className="text-sm">Zoom: {Math.round(stageScale * 100)}%</span>
        </div>
      )}
      
      {/* Zoom Controls */}
      <div className="absolute bottom-40 right-4 bg-black/40 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs text-gray-300 shadow-lg border border-white/10">
        <p>🖱️ Scroll: Zoom In/Out</p>
        <p className="text-xs text-green-400">Zoom: {Math.round(stageScale * 100)}%</p>
        <button
          onClick={() => {
            const stage = stageRef.current
            if (!stage) return
            stage.scale({ x: 1, y: 1 })
            stage.position({ x: 0, y: 0 })
            setStageScale(1)
            setStagePosition({ x: 0, y: 0 })
            setShowZoomIndicator(true)
            clearTimeout(zoomTimeoutRef.current)
            zoomTimeoutRef.current = setTimeout(() => {
              setShowZoomIndicator(false)
            }, 1500)
          }}
          className="w-full px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors text-xs font-semibold"
        >
          Reset Zoom
        </button>
      </div>
      
      {/* Coordinate Display */}
      {mousePos && (
        <div className="absolute bottom-40 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-gray-300 shadow-lg border border-white/10">
          <p className="text-white font-semibold">Cursor Position</p>
          {(() => {
            const worldPos = screenToWorld(mousePos.x, mousePos.y)
            const snapped = snapToGrid(worldPos.x, worldPos.y)
            const inBounds = isWithinBounds(snapped.x, snapped.y)
            return (
              <>
                <p>X: {(worldPos.x / PIXELS_PER_FOOT).toFixed(2)}ft</p>
                <p>Y: {(worldPos.y / PIXELS_PER_FOOT).toFixed(2)}ft</p>
                {showGrid && (
                  <>
                    <p className={`mt-1 ${inBounds ? 'text-blue-400' : 'text-red-400'}`}>
                      {inBounds ? 'Snap to Grid' : 'Out of Bounds'}
                    </p>
                    {inBounds && (
                      <>
                        <p className="text-blue-400">X: {(snapped.x / PIXELS_PER_FOOT).toFixed(2)}ft</p>
                        <p className="text-blue-400">Y: {(snapped.y / PIXELS_PER_FOOT).toFixed(2)}ft</p>
                      </>
                    )}
                  </>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default TrussCanvasClean