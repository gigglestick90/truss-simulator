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
   * Convert screen coordinates to world coordinates (accounting for axis padding)
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX - this.axisPadding.left,
      y: screenY - this.axisPadding.top
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX + this.axisPadding.left,
      y: worldY + this.axisPadding.top
    }
  }

  /**
   * Snap coordinates to nearest grid point
   */
  snapToGrid(x, y) {
    const world = this.screenToWorld(x, y)
    const snappedWorld = {
      x: Math.round(world.x / this.gridSize) * this.gridSize,
      y: Math.round(world.y / this.gridSize) * this.gridSize
    }
    return this.worldToScreen(snappedWorld.x, snappedWorld.y)
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
   */
  screenToFeet(x, y) {
    const world = this.screenToWorld(x, y)
    return {
      xFeet: world.x / this.pixelsPerFoot,
      yFeet: world.y / this.pixelsPerFoot
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
   */
  generateGridLines(canvasWidth, canvasHeight) {
    const lines = []
    
    // Calculate grid bounds in world coordinates
    const worldWidth = canvasWidth - this.axisPadding.left - this.axisPadding.right
    const worldHeight = canvasHeight - this.axisPadding.top - this.axisPadding.bottom

    // Vertical lines
    for (let x = 0; x <= worldWidth; x += this.gridSize) {
      lines.push({
        type: 'vertical',
        x1: x + this.axisPadding.left,
        y1: this.axisPadding.top,
        x2: x + this.axisPadding.left,
        y2: canvasHeight - this.axisPadding.bottom,
        isMajor: x % (this.gridSize * 5) === 0
      })
    }

    // Horizontal lines
    for (let y = 0; y <= worldHeight; y += this.gridSize) {
      lines.push({
        type: 'horizontal',
        x1: this.axisPadding.left,
        y1: y + this.axisPadding.top,
        x2: canvasWidth - this.axisPadding.right,
        y2: y + this.axisPadding.top,
        isMajor: y % (this.gridSize * 5) === 0
      })
    }

    return lines
  }

  /**
   * Get axis labels for the grid
   */
  getAxisLabels(canvasWidth, canvasHeight) {
    const labels = []
    
    const worldWidth = canvasWidth - this.axisPadding.left - this.axisPadding.right
    const worldHeight = canvasHeight - this.axisPadding.top - this.axisPadding.bottom

    // X-axis labels
    for (let x = 0; x <= worldWidth; x += this.gridSize * 5) {
      const feet = x / this.pixelsPerFoot
      labels.push({
        type: 'x',
        x: x + this.axisPadding.left,
        y: canvasHeight - this.axisPadding.bottom + 15,
        text: `${feet}`,
        align: 'center'
      })
    }

    // Y-axis labels (inverted for display)
    for (let y = 0; y <= worldHeight; y += this.gridSize * 5) {
      const feet = (worldHeight - y) / this.pixelsPerFoot
      if (feet >= 0) {
        labels.push({
          type: 'y',
          x: 10,
          y: y + this.axisPadding.top + 3,
          text: `${Math.round(feet)}`,
          align: 'left'
        })
      }
    }

    return labels
  }
}

export default GridManager