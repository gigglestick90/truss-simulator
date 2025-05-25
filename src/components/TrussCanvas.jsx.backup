import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Line, Circle, Text, Group, Rect } from 'react-konva'
import Konva from 'konva'
import useTrussStore from '../store/useTrussStore'
import { getStressColor, getStrokeWidth, formatForce } from '../utils/visualization'
import GridManager from '../utils/gridManager'
const TrussCanvas = ({ gridSettings = {} }) => {
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [showForceLabels] = useState(true)
  const [showDeflection, setShowDeflection] = useState(true)
  const [deflectionScale, setDeflectionScale] = useState(100)
  const showGrid = gridSettings.showGrid ?? true
  const gridSize = gridSettings.gridSize ?? 50
  const [hoveredNode, setHoveredNode] = useState(null)
  const isBuilderMode = gridSettings.isBuilderMode ?? false
  const [animationProgress, setAnimationProgress] = useState(1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [pulsePhase, setPulsePhase] = useState(0)
  const [ghostNode, setGhostNode] = useState(null)
  const [isDrawingMember, setIsDrawingMember] = useState(false)
  const [drawingStart, setDrawingStart] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  // const [selectedNode, setSelectedNode] = useState(null)
  // const [selectedMember, setSelectedMember] = useState(null)
  const builderTool = gridSettings.builderTool ?? 'member'
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState(null)
  const memberRefs = useRef({})
  const animationRef = useRef(null)
  const pulseAnimationRef = useRef(null)
  const stageRef = useRef(null)
  // Padding for axis labels
  const AXIS_PADDING = { left: 50, bottom: 40, top: 20, right: 20 }
  // Initialize GridManager
  const gridManager = useRef(new GridManager(gridSize, AXIS_PADDING))
  // Update GridManager when grid size changes
  useEffect(() => {
    gridManager.current.setGridSize(gridSize)
  }, [gridSize])
  // Get data from Zustand store
  const nodes = useTrussStore((state) => state.nodes)
  const members = useTrussStore((state) => state.members)
  const analysisResults = useTrussStore((state) => state.analysisResults)
  const addNode = useTrussStore((state) => state.addNode)
  const addMember = useTrussStore((state) => state.addMember)
  const deleteNode = useTrussStore((state) => state.deleteNode)
  const deleteMember = useTrussStore((state) => state.deleteMember)
  const toggleNodeSupport = useTrussStore((state) => state.toggleNodeSupport)
  const updateNode = useTrussStore((state) => state.updateNode)
  // Update dimensions on container resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        // Minimum size to accommodate 30 feet width and 20 feet height
        // 30 feet * 50 pixels/foot = 1500 pixels + padding
        const minWidth = 30 * 50 + AXIS_PADDING.left + AXIS_PADDING.right // 1570 pixels
        const minHeight = 20 * 50 + AXIS_PADDING.top + AXIS_PADDING.bottom // 1060 pixels
        setDimensions({
          width: Math.max(containerRef.current.offsetWidth, minWidth),
          height: Math.max(containerRef.current.offsetHeight, minHeight)
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  // Trigger force flow animation when analysis completes
  useEffect(() => {
    if (analysisResults.status === 'PASSED' || analysisResults.status === 'FAILED') {
      startForceFlowAnimation()
    }
  }, [analysisResults.status])
  // Start pulse animation for failed members
  useEffect(() => {
    if (analysisResults.failedMembers?.length > 0) {
      startPulseAnimation()
    } else {
      // Stop pulse animation
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
  // Force flow animation function
  const startForceFlowAnimation = () => {
    setIsAnimating(true)
    setAnimationProgress(0)
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    const startTime = Date.now()
    const duration = 2000 // 2 seconds
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Easing function for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3) // cubic ease-out
      setAnimationProgress(easedProgress)
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
  }
  // Pulse animation for failed members
  const startPulseAnimation = () => {
    const animate = () => {
      setPulsePhase(prev => (prev + 0.02) % 1)
      pulseAnimationRef.current = requestAnimationFrame(animate)
    }
    pulseAnimationRef.current = requestAnimationFrame(animate)
  }
  // Find max force for scaling
  const maxForce = Math.max(...members.map(m => Math.abs(m.force)), 1)
  // Calculate deflected node positions
  const getDeflectedPosition = (node) => {
    if (!showDeflection || analysisResults.status === 'NOT_ANALYZED') {
      return { x: node.x, y: node.y }
    }
    const displacement = analysisResults.nodeDisplacements?.find(d => d.nodeId === node.id)
    if (!displacement) return { x: node.x, y: node.y }
    return {
      x: node.x + displacement.dx * deflectionScale,
      y: node.y + displacement.dy * deflectionScale
    }
  }
  // Snap to grid function using GridManager
  const snapToGrid = useCallback((x, y) => {
    if (!showGrid) return { x, y }
    return gridManager.current.snapToGrid(x, y)
  }, [showGrid])
  // Generate grid lines and axis labels using GridManager
  const generateGridElements = () => {
    const elements = []
    // Get grid lines from GridManager
    const gridLines = gridManager.current.generateGridLines(dimensions.width, dimensions.height)
    gridLines.forEach((line, index) => {
      elements.push(
        <Line
          key={`line-${index}`}
          points={[line.x1, line.y1, line.x2, line.y2]}
          stroke={line.isMajor ? "#374151" : "#1f2937"}
          strokeWidth={line.isMajor ? 2 : 1}
          opacity={line.isMajor ? 0.7 : 0.5}
        />
      )
    })
    // Get axis labels from GridManager
    const labels = gridManager.current.getAxisLabels(dimensions.width, dimensions.height)
    labels.forEach((label, index) => {
      elements.push(
        <Text
          key={`label-${index}`}
          x={label.x}
          y={label.y}
          text={label.text}
          fontSize={12}
          fontFamily="Atkinson Hyperlegible"
          fill="#9ca3af"
          align={label.align}
          width={label.type === 'x' ? 30 : 35}
        />
      )
    })
    // Axis lines
    elements.push(
      <Line
        key="x-axis"
        points={[AXIS_PADDING.left, dimensions.height - AXIS_PADDING.bottom, dimensions.width - AXIS_PADDING.right, dimensions.height - AXIS_PADDING.bottom]}
        stroke="#444444"
        strokeWidth={2}
        opacity={0.8}
      />
    )
    elements.push(
      <Line
        key="y-axis"
        points={[AXIS_PADDING.left, AXIS_PADDING.top, AXIS_PADDING.left, dimensions.height - AXIS_PADDING.bottom]}
        stroke="#444444"
        strokeWidth={2}
        opacity={0.8}
      />
    )
    // Axis labels
    elements.push(
      <Text
        key="x-axis-label"
        x={dimensions.width / 2}
        y={dimensions.height - 10}
        text="X (feet)"
        fontSize={14}
        fontFamily="Atkinson Hyperlegible"
        fill="#888888"
        fontStyle="bold"
        align="center"
      />
    )
    elements.push(
      <Text
        key="y-axis-label"
        x={15}
        y={dimensions.height / 2}
        text="Y"
        fontSize={14}
        fontFamily="Atkinson Hyperlegible"
        fill="#888888"
        fontStyle="bold"
        rotation={-90}
      />
    )
    return elements
  }
  // Handle stage click for placing nodes
  const handleStageClick = (e) => {
    if (!isBuilderMode) return
    // Ignore right clicks on stage
    if (e.evt.button === 2) return
    // Clear selections when clicking stage
    // setSelectedNode(null)
    // setSelectedMember(null)
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    const snapped = snapToGrid(point.x, point.y)
    // Check if clicking on existing node using GridManager
    const clickedNode = nodes.find(n => 
      gridManager.current.isWithinSnapDistance(n.x, n.y, snapped.x, snapped.y, gridSize / 2)
    )
    if (clickedNode) {
      if (isDrawingMember && drawingStart?.id === clickedNode.id) {
        // Clicking same node cancels drawing
        setIsDrawingMember(false)
        setDrawingStart(null)
      } else if (builderTool === 'member') {
        // Start drawing member from this node
        setIsDrawingMember(true)
        setDrawingStart(clickedNode)
      }
    } else {
      if (isDrawingMember) {
        // Clicking empty space cancels member drawing
        setIsDrawingMember(false)
        setDrawingStart(null)
      } else {
        // Place new node
        const newNode = {
          x: snapped.x,
          y: snapped.y,
          label: String.fromCharCode(65 + nodes.length), // A, B, C, etc.
          support: null
        }
        addNode(newNode)
      }
    }
  }
  // Handle mouse move for ghost node and member drawing
  const handleMouseMove = (e) => {
    if (!isBuilderMode) return
    const stage = e.target.getStage()
    const point = stage.getPointerPosition()
    setMousePos(point)
    const snapped = snapToGrid(point.x, point.y)
    if (!isDrawingMember) {
      // Show ghost node preview
      setGhostNode(snapped)
    }
  }
  // Handle completing member drawing
  const handleNodeClick = (node, e) => {
    if (!isBuilderMode) return
    // Stop event propagation to prevent stage click
    if (e?.cancelBubble !== undefined) {
      e.cancelBubble = true
    }
    // Right-click to delete
    if (e?.evt?.button === 2) {
      e.evt.preventDefault()
      deleteNode(node.id)
      // Cancel any drawing state
      setIsDrawingMember(false)
      setDrawingStart(null)
      return
    }
    // Left click behavior based on selected tool
    if (!e || e?.evt?.button === 0) {
      if (builderTool === 'member') {
        if (isDrawingMember && drawingStart) {
          if (node.id !== drawingStart.id) {
            // Check if member already exists
            const memberExists = members.some(m => 
              (m.start === drawingStart.id && m.end === node.id) ||
              (m.start === node.id && m.end === drawingStart.id)
            )
            if (!memberExists) {
              addMember({
                start: drawingStart.id,
                end: node.id,
                area: 5.5 // Default 2x4 lumber
              })
            }
          }
          // Reset drawing state
          setIsDrawingMember(false)
          setDrawingStart(null)
        } else {
          // Start drawing member from this node
          setIsDrawingMember(true)
          setDrawingStart(node)
        }
      } else if (builderTool === 'fixed') {
        // Toggle fixed support
        toggleNodeSupport(node.id, 'fixed')
        // Prevent event from bubbling and affecting other components
        if (e && e.cancelBubble !== undefined) {
          e.cancelBubble = true
        }
      } else if (builderTool === 'roller') {
        // Toggle roller support
        toggleNodeSupport(node.id, 'roller')
        // Prevent event from bubbling and affecting other components
        if (e && e.cancelBubble !== undefined) {
          e.cancelBubble = true
        }
      }
    }
  }
  // Handle member click for deletion
  const handleMemberClick = (member, e) => {
    if (!isBuilderMode) return
    // Right-click to delete member
    if (e?.evt?.button === 2) {
      e.evt.preventDefault()
      e.cancelBubble = true
      deleteMember(member.id)
    }
  }
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <div ref={containerRef} className="absolute inset-0 overflow-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
        <Stage 
          ref={stageRef}
          width={dimensions.width} 
          height={dimensions.height}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setGhostNode(null)}
          onContextMenu={(e) => e.evt.preventDefault()}
        >
          <Layer>
            {/* Background with gradient */}
            <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fill="#0a0a1a"
          />
          <Rect
            x={0}
            y={0}
            width={dimensions.width}
            height={dimensions.height}
            fillLinearGradientStartPoint={{ x: 0, y: 0 }}
            fillLinearGradientEndPoint={{ x: dimensions.width, y: dimensions.height }}
            fillLinearGradientColorStops={[0, 'rgba(59, 130, 246, 0.05)', 1, 'rgba(139, 92, 246, 0.05)']}
          />
          {/* Grid lines and axis labels */}
          {showGrid && (
            <Group>
              {generateGridElements()}
            </Group>
          )}
          {/* Snap indicator crosshairs */}
          {isBuilderMode && ghostNode && showGrid && (
            <Group opacity={0.3}>
              <Line
                points={[ghostNode.x - 15, ghostNode.y, ghostNode.x + 15, ghostNode.y]}
                stroke="#60a5fa"
                strokeWidth={1}
              />
              <Line
                points={[ghostNode.x, ghostNode.y - 15, ghostNode.x, ghostNode.y + 15]}
                stroke="#60a5fa"
                strokeWidth={1}
              />
            </Group>
          )}
          {/* Ghost node preview */}
          {isBuilderMode && ghostNode && !isDrawingMember && (
            <Group opacity={0.5}>
              <Circle
                x={ghostNode.x}
                y={ghostNode.y}
                radius={8}
                fill="#60a5fa"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Text
                x={ghostNode.x - 10}
                y={ghostNode.y - 25}
                text={String.fromCharCode(65 + nodes.length)}
                fontSize={14}
                fontFamily="Atkinson Hyperlegible"
                fill="#60a5fa"
                align="center"
                width={20}
              />
              {/* Show coordinates */}
              <Text
                x={ghostNode.x - 30}
                y={ghostNode.y + 15}
                text={`${gridManager.current.screenToFeet(ghostNode.x, ghostNode.y).xFeet.toFixed(1)}, ${((dimensions.height - AXIS_PADDING.bottom - ghostNode.y)/50).toFixed(1)}`}
                fontSize={10}
                fontFamily="Atkinson Hyperlegible"
                fill="#94a3b8"
                align="center"
                width={60}
              />
            </Group>
          )}
          {/* Drawing member preview */}
          {isBuilderMode && isDrawingMember && drawingStart && (
            <Group>
              <Line
                points={[drawingStart.x, drawingStart.y, mousePos.x, mousePos.y]}
                stroke="#60a5fa"
                strokeWidth={3}
                opacity={0.6}
                dash={[10, 5]}
              />
              {/* Member length display */}
              <Text
                x={(drawingStart.x + mousePos.x) / 2 - 30}
                y={(drawingStart.y + mousePos.y) / 2 - 15}
                text={`${gridManager.current.getDistanceInFeet(drawingStart.x, drawingStart.y, mousePos.x, mousePos.y).toFixed(1)} ft`}
                fontSize={12}
                fontFamily="Atkinson Hyperlegible"
                fill="#60a5fa"
                align="center"
                width={60}
                stroke="#0f0f23"
                strokeWidth={0.5}
              />
            </Group>
          )}
          {/* Draw original shape as ghost if deflection is shown */}
          {showDeflection && analysisResults.status !== 'NOT_ANALYZED' && (
            <Group>
              {members.map(member => {
                const startNode = nodes.find(n => n.id === member.start)
                const endNode = nodes.find(n => n.id === member.end)
                if (!startNode || !endNode) return null
                return (
                  <Line
                    key={`ghost-${member.id}`}
                    points={[startNode.x, startNode.y, endNode.x, endNode.y]}
                    stroke="#00ff88"
                    strokeWidth={2}
                    opacity={0.7}
                    dash={[8, 4]}
                    shadowBlur={8}
                    shadowColor="#00ff88"
                    shadowOpacity={0.5}
                  />
                )
              })}
              {/* Ghost nodes */}
              {nodes.map(node => (
                <Circle
                  key={`ghost-node-${node.id}`}
                  x={node.x}
                  y={node.y}
                  radius={4}
                  fill="#00ff88"
                  opacity={0.7}
                  shadowBlur={6}
                  shadowColor="#00ff88"
                />
              ))}
            </Group>
          )}
          {/* Draw members (deflected or original) */}
          {members.map((member, index) => {
            const startNode = nodes.find(n => n.id === member.start)
            const endNode = nodes.find(n => n.id === member.end)
            if (!startNode || !endNode) return null
            const deflectedStart = getDeflectedPosition(startNode)
            const deflectedEnd = getDeflectedPosition(endNode)
            const midX = (deflectedStart.x + deflectedEnd.x) / 2
            const midY = (deflectedStart.y + deflectedEnd.y) / 2
            // Calculate animated values
            const animatedForce = member.force * animationProgress
            const animatedOpacity = 0.3 + (0.6 * animationProgress)
            const animatedStrokeWidth = isAnimating 
              ? 2 + (getStrokeWidth(member.force, maxForce) - 2) * animationProgress
              : getStrokeWidth(member.force, maxForce)
            // Stagger animation for each member
            const memberDelay = index * 0.1 // 100ms delay between members
            const memberProgress = Math.max(0, Math.min(1, (animationProgress * 2000 - memberDelay * 1000) / 1000))
            // Check if this member is failed
            const isFailed = analysisResults.failedMembers?.includes(member.id)
            const pulseGlow = Math.sin(pulsePhase * Math.PI * 2) * 0.5 + 0.5 // 0 to 1
            return (
              <Group key={member.id} onClick={(e) => handleMemberClick(member, e)} onTap={(e) => handleMemberClick(member, e)}>
                {/* Failure glow effect */}
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
                {/* Add glow for deflected shape */}
                {showDeflection && analysisResults.status !== 'NOT_ANALYZED' && (
                  <Line
                    points={[deflectedStart.x, deflectedStart.y, deflectedEnd.x, deflectedEnd.y]}
                    stroke={getStressColor(member.force, maxForce)}
                    strokeWidth={animatedStrokeWidth + 4}
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
                {/* Force flow indicator */}
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
                {/* Force label */}
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
          })}
          {/* Draw nodes */}
          {nodes.map(node => {
            const deflectedPos = getDeflectedPosition(node)
            const isHovered = hoveredNode === node.id
            return (
              <Group key={node.id}>
                {/* Node hover effect */}
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
                {/* Drawing mode highlight */}
                {isBuilderMode && isDrawingMember && drawingStart?.id === node.id && (
                  <Circle
                    x={deflectedPos.x}
                    y={deflectedPos.y}
                    radius={12}
                    stroke="#60a5fa"
                    strokeWidth={2}
                    dash={[5, 5]}
                    opacity={0.8}
                  />
                )}
                <Circle
                  x={deflectedPos.x}
                  y={deflectedPos.y}
                  radius={8}
                  fill={isHovered ? "#60a5fa" : "#ffffff"}
                  stroke={isHovered ? "#3b82f6" : "#333333"}
                  strokeWidth={2}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={(e) => handleNodeClick(node, e)}
                  onTap={(e) => handleNodeClick(node, e)}
                  scaleX={isHovered ? 1.1 : 1}
                  scaleY={isHovered ? 1.1 : 1}
                  cursor={isBuilderMode ? (isDragging && draggedNodeId === node.id ? 'grabbing' : 'grab') : 'default'}
                  draggable={isBuilderMode && builderTool === 'member'}
                  onDragStart={() => {
                    if (isBuilderMode && builderTool === 'member') {
                      setIsDragging(true)
                      setDraggedNodeId(node.id)
                      // Cancel any member drawing
                      setIsDrawingMember(false)
                      setDrawingStart(null)
                    }
                  }}
                  onDragEnd={(e) => {
                    if (isDragging && draggedNodeId === node.id) {
                      const pos = e.target.position()
                      const snapped = snapToGrid(pos.x, pos.y)
                      // Check if new position would overlap another node
                      const wouldOverlap = nodes.some(n => 
                        n.id !== node.id && 
                        gridManager.current.isWithinSnapDistance(n.x, n.y, snapped.x, snapped.y, gridSize / 3)
                      )
                      if (!wouldOverlap) {
                        updateNode(node.id, { x: snapped.x, y: snapped.y })
                      } else {
                        // Reset to original position
                        e.target.position({ x: node.x, y: node.y })
                      }
                      setIsDragging(false)
                      setDraggedNodeId(null)
                    }
                  }}
                  onDragMove={(e) => {
                    if (isDragging && draggedNodeId === node.id) {
                      const pos = e.target.position()
                      const snapped = snapToGrid(pos.x, pos.y)
                      e.target.position(snapped)
                    }
                  }}
                  opacity={isDragging && draggedNodeId === node.id ? 0.7 : 1}
                />
                <Text
                  x={deflectedPos.x - 10}
                  y={deflectedPos.y - 25}
                  text={node.label}
                  fontSize={14}
                  fontFamily="Atkinson Hyperlegible"
                  fill="#ffffff"
                  align="center"
                  width={20}
                  listening={false} // Prevent text from interfering with node dragging
                />
                {/* Node tooltip on hover */}
                {isHovered && analysisResults.status !== 'NOT_ANALYZED' && (
                  <Group>
                    <Rect
                      x={deflectedPos.x + 15}
                      y={deflectedPos.y - 30}
                      width={120}
                      height={50}
                      fill="#1a1a2e"
                      stroke="#3b82f6"
                      strokeWidth={1}
                      cornerRadius={4}
                      opacity={0.9}
                    />
                    <Text
                      x={deflectedPos.x + 20}
                      y={deflectedPos.y - 25}
                      text={`Node ${node.label}\nX: ${gridManager.current.screenToFeet(node.x, node.y).xFeet.toFixed(1)}ft\nY: ${((dimensions.height - AXIS_PADDING.bottom - node.y)/50).toFixed(1)}ft`}
                      fontSize={10}
                      fontFamily="Atkinson Hyperlegible"
                      fill="#ffffff"
                      width={110}
                    />
                  </Group>
                )}
                {/* Support indicator for this node */}
                {node.support === 'fixed' && (
                  <Line
                    points={[deflectedPos.x - 12, deflectedPos.y + 12, deflectedPos.x + 12, deflectedPos.y + 12, deflectedPos.x, deflectedPos.y + 24, deflectedPos.x - 12, deflectedPos.y + 12]}
                    stroke="#00ff00"
                    strokeWidth={3}
                    closed
                    fill="#00ff00"
                    opacity={0.8}
                    shadowBlur={5}
                    shadowColor="#00ff00"
                    listening={false} // Prevent support from interfering with node dragging
                  />
                )}
                {node.support === 'roller' && (
                  <Group listening={false}> {/* Prevent support from interfering with node dragging */}
                    <Circle
                      x={deflectedPos.x}
                      y={deflectedPos.y + 18}
                      radius={6}
                      fill="#00ff00"
                      stroke="#00ff00"
                      strokeWidth={3}
                      opacity={0.8}
                      shadowBlur={5}
                      shadowColor="#00ff00"
                    />
                    <Line
                      points={[deflectedPos.x - 12, deflectedPos.y + 24, deflectedPos.x + 12, deflectedPos.y + 24]}
                      stroke="#00ff00"
                      strokeWidth={3}
                      opacity={0.8}
                    />
                  </Group>
                )}
              </Group>
            )
          })}
          </Layer>
        </Stage>
      </div>
      {/* Deflection Controls */}
      {analysisResults.status !== 'NOT_ANALYZED' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/40 backdrop-blur-sm rounded-xl p-4 space-y-3 shadow-2xl border border-white/20">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-gray-200">Show Deflection</label>
            <button
              onClick={() => setShowDeflection(!showDeflection)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showDeflection ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'
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
    </div>
  )
}
export default TrussCanvas