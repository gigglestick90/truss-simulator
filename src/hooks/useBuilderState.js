import { useState, useCallback } from 'react'

/**
 * Custom hook for managing builder tool state machine
 * Provides a clean interface for tool state management
 */
export const useBuilderState = () => {
  const [state, setState] = useState({
    mode: 'view', // 'view' | 'build'
    tool: 'member', // 'member' | 'fixed' | 'roller'
    isDrawingMember: false,
    drawingStartNode: null,
    selectedNode: null,
    selectedMember: null,
    isDraggingNode: false,
    draggedNode: null
  })

  // Enter builder mode
  const enterBuilderMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'build',
      tool: 'member',
      isDrawingMember: false,
      drawingStartNode: null
    }))
  }, [])

  // Exit builder mode
  const exitBuilderMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      mode: 'view',
      isDrawingMember: false,
      drawingStartNode: null,
      selectedNode: null,
      selectedMember: null,
      isDraggingNode: false,
      draggedNode: null
    }))
  }, [])

  // Toggle builder mode
  const toggleMode = useCallback(() => {
    if (state.mode === 'view') {
      enterBuilderMode()
    } else {
      exitBuilderMode()
    }
  }, [state.mode, enterBuilderMode, exitBuilderMode])

  // Select tool
  const selectTool = useCallback((tool) => {
    setState(prev => ({
      ...prev,
      tool,
      isDrawingMember: false,
      drawingStartNode: null
    }))
  }, [])

  // Start drawing member
  const startDrawingMember = useCallback((node) => {
    if (state.tool === 'member') {
      setState(prev => ({
        ...prev,
        isDrawingMember: true,
        drawingStartNode: node
      }))
    }
  }, [state.tool])

  // Cancel drawing member
  const cancelDrawing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawingMember: false,
      drawingStartNode: null
    }))
  }, [])

  // Complete drawing member
  const completeDrawing = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawingMember: false,
      drawingStartNode: null
    }))
  }, [])

  // Select node
  const selectNode = useCallback((node) => {
    setState(prev => ({
      ...prev,
      selectedNode: node,
      selectedMember: null
    }))
  }, [])

  // Select member
  const selectMember = useCallback((member) => {
    setState(prev => ({
      ...prev,
      selectedMember: member,
      selectedNode: null
    }))
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNode: null,
      selectedMember: null
    }))
  }, [])

  // Start dragging node
  const startDraggingNode = useCallback((node) => {
    setState(prev => ({
      ...prev,
      isDraggingNode: true,
      draggedNode: node
    }))
  }, [])

  // Stop dragging node
  const stopDraggingNode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDraggingNode: false,
      draggedNode: null
    }))
  }, [])

  // Cancel any active operation
  const cancelOperation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isDrawingMember: false,
      drawingStartNode: null,
      isDraggingNode: false,
      draggedNode: null
    }))
  }, [])

  return {
    // State
    ...state,
    isBuilderMode: state.mode === 'build',
    
    // Actions
    enterBuilderMode,
    exitBuilderMode,
    toggleMode,
    selectTool,
    startDrawingMember,
    cancelDrawing,
    completeDrawing,
    selectNode,
    selectMember,
    clearSelection,
    startDraggingNode,
    stopDraggingNode,
    cancelOperation
  }
}