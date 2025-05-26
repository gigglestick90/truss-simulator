# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Truss Analysis Simulator

A 2D structural analysis tool for residential wood trusses with real-time physics simulation, interactive builder, and engineering code compliance (IBC/NDS standards).

## Common Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Architecture Overview

### State Management (Zustand)
Central store at `src/store/useTrussStore.js` manages:
- **Geometry**: nodes[], members[] with UUID-based IDs
- **Materials**: wood species properties (E, Fb, Fc) and lumber sizes with moment of inertia
- **Loads**: dead/live/snow in PSF, distributed to topmost nodes
- **Analysis Results**: forces, deflections, stress ratios, pass/fail status

Key action: `runAnalysis()` triggers the calculation pipeline:
1. Force analysis via Method of Joints (`trussAnalysis.js`)
2. Deflection calculation with virtual work (`deflection.js`)
3. Stress/deflection limit checking per building codes

### Canvas System (React-Konva)
`TrussCanvasClean.jsx` implements an infinite, zoomable workspace:
- **Coordinate System**: 50 pixels = 1 foot, Y-up convention
- **Zoom**: 20-500% via mouse wheel, centered on cursor
- **Builder Tools**: Member drawing, fixed/roller support placement
- **Node Dragging**: Real-time position updates with grid snap
- **Deflection Visualization**: Shows original structure (green dashed) vs deflected shape

**CRITICAL React-Konva Rules**:
- No comments/whitespace inside Stage/Layer components
- Only Konva components allowed (Line, Circle, Text, Group, Rect)
- Use helper functions for conditional rendering
- Batch updates for performance

### Analysis Engine
- **Force Calculation**: Method of Joints solver for statically determinate structures
- **Deflection**: Simplified virtual work with member-specific moment of inertia
- **Unit Conversion**: Forces in pounds, deflections in inches, properly converted to pixels
- **Buckling**: Euler formula with slenderness ratio for compression members
- **Limits**: L/240 for roof live load deflection (IBC requirement)

### Material System
- **Wood Species**: Pre-defined properties from NDS tables
- **Lumber Sizes**: 2x4 through 8x48 with calculated I values
- **Member Properties**: Each member stores area and momentOfInertia
- **Auto-update**: Changing lumber size updates all existing members

## Critical Implementation Details

### Deflection Display Fix
```javascript
// Convert deflection from inches to pixels
const inchesToPixels = PIXELS_PER_FOOT / 12
const deflectedX = node.x + (nodeResult.dx * inchesToPixels * deflectionScale / 100)
const deflectedY = node.y + (nodeResult.dy * inchesToPixels * deflectionScale / 100)
```

### Node Deflection Data Structure
Store uses `nodeDeflections` (not `nodeDisplacements`):
```javascript
nodeDeflections: [{ nodeId, id, dx, dy }]  // dx, dy in inches
```

### Member Force Coloring
- Tension (positive): Red gradient
- Compression (negative): Blue gradient  
- Failed members: Pulsing red glow animation
- Zero force: Gray (common in determinate structures)

### Save/Load Format
JSON version 1.0.0 includes:
- Complete geometry (nodes, members with UUIDs)
- Material selections and lumber sizes
- Load values and analysis results
- UI state (zoom, pan, grid settings)

## Performance Considerations

- Grid renders only visible area during pan/zoom
- Analysis results cached until geometry/loads change
- Deflection scale changes don't re-run analysis
- UUID generation uses optimized algorithm
- Konva batch updates for smooth animations

## Known Limitations

- 2D analysis only (no out-of-plane effects)
- Single load case (no combinations)
- Simplified deflection (not full FEA)
- Requires statically determinate structures
- No dynamic/wind loads

## Tailwind CSS v4 Configuration

Uses new import syntax without config file:
```css
@import "tailwindcss";
```

PostCSS configured with `@tailwindcss/postcss` plugin only.