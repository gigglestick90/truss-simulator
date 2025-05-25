/**
 * GridManager - Handles all grid-related operations and coordinate transformations
 * Provides a clean abstraction for grid snapping, coordinate conversion, and validation
 */

class GridManager {
  constructor(gridSize = 50, axisPadding = { left: 50, bottom: 40, top: 20, right: 20 }) {
    this.gridSize = gridSize // pixels per grid unit (default: 50px = 1ft)
    this.axisPadding = axisPadding
    this.pixelsPerFoot = 50
  }

  /**
   * Update grid size
   */
  setGridSize(size) {
    this.gridSize = size
  }

  /**
   * Convert screen coordinates to world coordinates (no axis padding in infinite grid)
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX,
      y: screenY
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX,
      y: worldY
    }
  }

  /**
   * Snap coordinates to nearest grid point
   */
  snapToGrid(x, y) {
    return {
      x: Math.round(x / this.gridSize) * this.gridSize,
      y: Math.round(y / this.gridSize) * this.gridSize
    }
  }

  /**
   * Get grid coordinates (in grid units, not pixels)
   */
  getGridCoordinates(x, y) {
    const world = this.screenToWorld(x, y)
    return {
      gridX: Math.round(world.x / this.gridSize),
      gridY: Math.round(world.y / this.gridSize)
    }
  }

  /**
   * Convert grid coordinates to screen coordinates
   */
  gridToScreen(gridX, gridY) {
    const worldX = gridX * this.gridSize
    const worldY = gridY * this.gridSize
    return this.worldToScreen(worldX, worldY)
  }

  /**
   * Get coordinates in feet (for display)
   * @param {number} x - X coordinate in pixels
   * @param {number} y - Y coordinate in pixels 
   * @param {boolean} invertY - Whether to invert Y axis (positive up)
   */
  screenToFeet(x, y, invertY = true) {
    return {
      xFeet: x / this.pixelsPerFoot,
      yFeet: invertY ? -y / this.pixelsPerFoot : y / this.pixelsPerFoot
    }
  }

  /**
   * Check if two points are at the same grid position
   */
  isSameGridPosition(x1, y1, x2, y2) {
    const grid1 = this.getGridCoordinates(x1, y1)
    const grid2 = this.getGridCoordinates(x2, y2)
    return grid1.gridX === grid2.gridX && grid1.gridY === grid2.gridY
  }

  /**
   * Get distance between two points in pixels
   */
  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1
    const dy = y2 - y1
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Get distance in feet
   */
  getDistanceInFeet(x1, y1, x2, y2) {
    return this.getDistance(x1, y1, x2, y2) / this.pixelsPerFoot
  }

  /**
   * Check if a point is within snap distance of another point
   */
  isWithinSnapDistance(x1, y1, x2, y2, snapDistance = 15) {
    return this.getDistance(x1, y1, x2, y2) < snapDistance
  }

  /**
   * Get angle between two points in degrees
   */
  getAngle(x1, y1, x2, y2) {
    const dx = x2 - x1
    const dy = y2 - y1
    const radians = Math.atan2(dy, dx)
    return (radians * 180 / Math.PI + 360) % 360
  }

  /**
   * Generate grid lines for rendering
   * @param {number} visibleWidth - Width of the visible area in world coordinates
   * @param {number} visibleHeight - Height of the visible area in world coordinates
   * @param {number} offsetX - X offset in world coordinates (for panned view)
   * @param {number} offsetY - Y offset in world coordinates (for panned view)
   */
  generateGridLines(visibleWidth, visibleHeight, offsetX = 0, offsetY = 0) {
    const lines = []
    
    // Add buffer to ensure smooth panning (grid extends beyond visible area)
    const buffer = this.gridSize * 2
    
    // Calculate the starting grid positions based on offset
    const startX = Math.floor((offsetX - buffer) / this.gridSize) * this.gridSize
    const startY = Math.floor((offsetY - buffer) / this.gridSize) * this.gridSize
    const endX = offsetX + visibleWidth + buffer
    const endY = offsetY + visibleHeight + buffer

    // Vertical lines - use world coordinates
    for (let x = startX; x <= endX; x += this.gridSize) {
      lines.push({
        type: 'vertical',
        x1: x,
        y1: startY,
        x2: x,
        y2: endY,
        isMajor: Math.abs(x) % (this.gridSize * 5) < 1
      })
    }

    // Horizontal lines - use world coordinates
    for (let y = startY; y <= endY; y += this.gridSize) {
      lines.push({
        type: 'horizontal',
        x1: startX,
        y1: y,
        x2: endX,
        y2: y,
        isMajor: Math.abs(y) % (this.gridSize * 5) < 1
      })
    }

    return lines
  }

  /**
   * Get axis labels for the grid
   * @param {number} visibleWidth - Width of the visible area in world coordinates
   * @param {number} visibleHeight - Height of the visible area in world coordinates
   * @param {number} offsetX - X offset in world coordinates (for panned view)
   * @param {number} offsetY - Y offset in world coordinates (for panned view)
   * @param {boolean} invertY - Whether to invert Y axis (positive up)
   */
  getAxisLabels(visibleWidth, visibleHeight, offsetX = 0, offsetY = 0, invertY = false) {
    const labels = []
    
    // Determine label spacing based on grid size
    const labelSpacing = this.gridSize >= 100 ? this.gridSize : this.gridSize * 5
    
    // Calculate the starting grid positions based on offset
    const startX = Math.floor(offsetX / labelSpacing) * labelSpacing
    const startY = Math.floor(offsetY / labelSpacing) * labelSpacing
    const endX = offsetX + visibleWidth
    const endY = offsetY + visibleHeight

    // X-axis labels
    for (let x = startX; x <= endX; x += labelSpacing) {
      const screenX = x - offsetX
      const feet = x / this.pixelsPerFoot
      labels.push({
        type: 'x',
        x: screenX,
        y: visibleHeight - 20,
        text: `${feet.toFixed(this.gridSize >= 50 ? 0 : 1)}`,
        align: 'center'
      })
    }

    // Y-axis labels
    for (let y = startY; y <= endY; y += labelSpacing) {
      const screenY = y - offsetY
      const feet = invertY ? -y / this.pixelsPerFoot : y / this.pixelsPerFoot
      labels.push({
        type: 'y',
        x: 10,
        y: screenY + 3,
        text: `${feet.toFixed(this.gridSize >= 50 ? 0 : 1)}`,
        align: 'left'
      })
    }

    return labels
  }
}

export default GridManager