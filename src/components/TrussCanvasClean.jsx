import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Stage, Layer, Line, Circle, Text, Group, Rect } from 'react-konva'
import Konva from 'konva'
import useTrussStore from '../store/useTrussStore'
import { getStressColor, getStrokeWidth, formatForce } from '../utils/visualization'
import GridManager from '../utils/gridManager'

// Clean version of TrussCanvas without comments inside Konva components
const TrussCanvasClean = ({ gridSettings = {} }) => {
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
  const [isDrawingMember, setIsDrawingMember] = useState(false)
  const [drawingStart, setDrawingStart] = useState(null)
  const [ghostNode, setGhostNode] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const builderTool = gridSettings.builderTool ?? 'member'
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeId, setDraggedNodeId] = useState(null)
  const [stageScale, setStageScale] = useState(1)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const [showZoomIndicator, setShowZoomIndicator] = useState(false)
  const zoomTimeoutRef = useRef(null)
  const memberRefs = useRef({})
  const animationRef = useRef(null)
  const pulseAnimationRef = useRef(null)
  const stageRef = useRef(null)
  
  const AXIS_PADDING = { left: 50, bottom: 40, top: 20, right: 20 }
  const gridManager = useRef(new GridManager(gridSize, AXIS_PADDING))
  
  useEffect(() => {
    gridManager.current.setGridSize(gridSize)
  }, [gridSize])
  
  const nodes = useTrussStore((state) => state.nodes)
  const members = useTrussStore((state) => state.members)
  const analysisResults = useTrussStore((state) => state.analysisResults)
  const addNode = useTrussStore((state) => state.addNode)
  const addMember = useTrussStore((state) => state.addMember)
  const deleteNode = useTrussStore((state) => state.deleteNode)
  const deleteMember = useTrussStore((state) => state.deleteMember)
  const toggleNodeSupport = useTrussStore((state) => state.toggleNodeSupport)
  const updateNode = useTrussStore((state) => state.updateNode)
  
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        // Set canvas to viewport size for dynamic zooming
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      }
    }
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [AXIS_PADDING.left, AXIS_PADDING.right, AXIS_PADDING.top, AXIS_PADDING.bottom])
  
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
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    
    const startTime = Date.now()
    const duration = 2000
    
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      
      setAnimationProgress(easedProgress)
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
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
  
  const maxForce = Math.max(...members.map(m => Math.abs(m.force)), 1)
  
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
  
  const snapToGrid = useCallback((x, y) => {
    if (!showGrid) return { x, y }
    return gridManager.current.snapToGrid(x, y)
  }, [showGrid])
  
  const generateGridElements = () => {
    const elements = []
    
    // Calculate visible area based on zoom
    const stage = stageRef.current
    const scale = stage ? stage.scaleX() : 1
    const pos = stage ? stage.position() : { x: 0, y: 0 }
    
    // Calculate the visible bounds in world coordinates
    const visibleX = -pos.x / scale
    const visibleY = -pos.y / scale
    
    const gridLines = gridManager.current.generateGridLines(
      dimensions.width, 
      dimensions.height,
      visibleX,
      visibleY
    )
    
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
    
    const labels = gridManager.current.getAxisLabels(
      dimensions.width, 
      dimensions.height,
      visibleX,
      visibleY
    )
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
  
  const handleStageClick = (e) => {
    if (!isBuilderMode) return
    if (e.evt.button === 2) return
    
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    
    // Transform pointer position to account for stage scale and position
    const transform = stage.getAbsoluteTransform().copy()
    transform.invert()
    const point = transform.point(pointer)
    
    const snapped = snapToGrid(point.x, point.y)
    
    const clickedNode = nodes.find(n => 
      gridManager.current.isWithinSnapDistance(n.x, n.y, snapped.x, snapped.y, gridSize / 2)
    )
    
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
          x: snapped.x,
          y: snapped.y,
          label: String.fromCharCode(65 + nodes.length),
          support: null
        }
        addNode(newNode)
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
    
    // Limit zoom range
    const limitedScale = Math.max(0.2, Math.min(5, newScale))
    
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
  
  const handleMouseMove = (e) => {
    if (!isBuilderMode) return
    const stage = e.target.getStage()
    const pointer = stage.getPointerPosition()
    
    // Transform pointer position to account for stage scale and position
    const transform = stage.getAbsoluteTransform().copy()
    transform.invert()
    const pos = transform.point(pointer)
    
    setMousePos(pos)
    const snapped = snapToGrid(pos.x, pos.y)
    if (!isDrawingMember) {
      setGhostNode(snapped)
    }
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
      e.cancelBubble = true
      deleteMember(member.id)
    }
  }
  
  // Render helpers to keep the JSX clean
  const renderBackground = () => (
    <Group>
      <Rect x={0} y={0} width={dimensions.width} height={dimensions.height} fill="#0a0a1a" />
      <Rect
        x={0}
        y={0}
        width={dimensions.width}
        height={dimensions.height}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: dimensions.width, y: dimensions.height }}
        fillLinearGradientColorStops={[0, 'rgba(59, 130, 246, 0.05)', 1, 'rgba(139, 92, 246, 0.05)']}
      />
    </Group>
  )
  
  const renderGrid = () => {
    if (!showGrid) return null
    // Force re-render when stage scale or position changes
    return <Group key={`grid-${stageScale}-${stagePosition.x}-${stagePosition.y}`}>{generateGridElements()}</Group>
  }
  
  const renderSnapIndicator = () => {
    if (!isBuilderMode || !ghostNode || !showGrid) return null
    
    return (
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
    )
  }
  
  const renderGhostNode = () => {
    if (!isBuilderMode || !ghostNode || isDrawingMember) return null
    
    return (
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
    )
  }
  
  const renderDrawingMember = () => {
    if (!isBuilderMode || !isDrawingMember || !drawingStart) return null
    
    return (
      <Group>
        <Line
          points={[drawingStart.x, drawingStart.y, mousePos.x, mousePos.y]}
          stroke="#60a5fa"
          strokeWidth={3}
          opacity={0.6}
          dash={[10, 5]}
        />
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
    )
  }
  
  const renderGhostMembers = () => {
    if (!showDeflection || analysisResults.status === 'NOT_ANALYZED') return null
    
    return (
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
            draggable={isBuilderMode && !isDrawingMember}
            onDragStart={() => {
              if (isBuilderMode && !isDrawingMember) {
                setIsDragging(true)
                setDraggedNodeId(node.id)
                setIsDrawingMember(false)
                setDrawingStart(null)
              }
            }}
            onDragEnd={(e) => {
              if (isDragging && draggedNodeId === node.id) {
                const pos = e.target.position()
                const snapped = snapToGrid(pos.x, pos.y)
                const wouldOverlap = nodes.some(n => 
                  n.id !== node.id && 
                  gridManager.current.isWithinSnapDistance(n.x, n.y, snapped.x, snapped.y, gridSize / 3)
                )
                if (!wouldOverlap) {
                  updateNode(node.id, { x: snapped.x, y: snapped.y })
                } else {
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
            listening={false}
          />
          
          {isHovered && analysisResults.status !== 'NOT_ANALYZED' && (
            <Group>
              <Rect
                x={deflectedPos.x + 15}
                y={deflectedPos.y - 30}
                width={120}
                height={50}
                fill="black"
                stroke="#333"
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
              listening={false}
            />
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
      
      {/* Zoom Indicator */}
      {showZoomIndicator && (
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2 text-white font-semibold shadow-lg border border-white/20 transition-opacity duration-300">
          <span className="text-sm">Zoom: {Math.round(stageScale * 100)}%</span>
        </div>
      )}
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs text-gray-300 shadow-lg border border-white/10">
        <p>🖱️ Scroll: Zoom In/Out</p>
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
    </div>
  )
}

export default TrussCanvasClean