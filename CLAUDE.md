# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Truss Analysis Simulator

A visual 2D physics simulator for residential wood floor and roof trusses, designed for Pittsburgh, PA building standards. Features an interactive builder, real-time structural analysis, infinite canvas with zoom/pan, and beautiful glassmorphism UI design.

## Common Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Installation
npm install          # Install all dependencies
```

## Tech Stack

- **React 19** with Vite
- **Tailwind CSS v4** (uses new `@import "tailwindcss"` syntax)
- **React-Konva** for 2D canvas rendering
- **Zustand** for state management
- **PostCSS** with @tailwindcss/postcss plugin
- **Atkinson Hyperlegible** font for accessibility

## Architecture Overview

### State Management Flow
The app uses Zustand for centralized state management with the following flow:
1. User interactions trigger store actions:
   - Load sliders update `loads` state
   - Material selection updates `material` state
   - Builder mode enables interactive node/member creation
   - Node dragging updates positions dynamically
2. `runAnalysis()` action performs structural calculations in sequence:
   - Force analysis via Method of Joints (`trussAnalysis.js`)
   - Deflection calculation (`deflection.js`)
   - Stress ratio and failure checking
3. Components subscribe to store slices and re-render automatically

### Interactive Builder System
The app features a full interactive truss builder with:
- **Builder Mode**: Toggle between view and build modes
- **Tool System**: Three tools - Member (connect nodes), Fixed (△ support), Roller (○ support)
- **Node Management**: Click to place, drag to move, right-click to delete
- **Member Drawing**: Click-drag between nodes with visual feedback
- **Grid System**: Configurable snap-to-grid with 0.25ft, 0.5ft, 1ft, 2ft, 3ft spacing
- **Node Dragging**: Reposition nodes with automatic member updates
- **Infinite Canvas**: Zoom out to access unlimited working area
- **Mouse Wheel Zoom**: Scroll to zoom in/out, centered on cursor position

### Save/Load System
- **SaveLoadPanel**: Export/import complete designs as JSON files
- **File Format**: Version 1.0.0 with metadata (timestamp, name, description)
- **Data Persistence**: Stores nodes, members, materials, loads, lumber sizes, and UI state

### Preset Templates
- **PresetSelector**: Quick-start with 6 common truss configurations
- **Available Presets**: King Post, Queen Post, Fink, Howe, Pratt, Simple Beam
- **Dynamic IDs**: Each preset generates fresh UUIDs on load

### Key Architectural Decisions

**Canvas Rendering**: React-Konva provides a declarative API for 2D graphics. The TrussCanvasClean component:
- Renders members with stress-based coloring (tension=red, compression=blue)
- Shows deflected shape with exaggeration factor (10x-500x)
- Overlays ghost outline of original shape when deflection is active (bright green #00ff88)
- Supports infinite canvas with dynamic grid expansion
- Mouse wheel zoom (20% to 500%) centered on cursor
- Dynamic grid rendering based on visible area
- Grid settings now in dedicated right sidebar component
- **CRITICAL**: No comments, whitespace, or React Fragments inside Stage/Layer components

**Analysis Engine**: Pure functions for testability
- `analyzeTruss()`: Distributes loads and solves for member forces
- `calculateDeflections()`: Computes node displacements using simplified virtual work
- Deflection calculations now use actual moment of inertia for each member
- Buckling effects considered for compression members based on slenderness ratio
- Results cached in store to avoid recalculation on visual-only changes
- Dynamic load distribution to topmost nodes (within 50px of highest point)

**UI Design**: Modern glassmorphism aesthetic
- Animated gradient background with floating blobs
- Semi-transparent panels with backdrop blur
- Smooth transitions and hover effects
- Emoji icons for visual interest
- Responsive layout with proper scrolling

## Critical Implementation Details

### Coordinate System & Scale
- Scale: 50 pixels = 1 foot (real-world units)
- Origin: Top-left corner (0,0) 
- Canvas has axis padding: left=50px, bottom=40px, top=20px, right=20px
- Grid snapping rounds to nearest grid unit
- Y-axis inverted for display (0ft at bottom in labels)

### Node & Member ID System
- Nodes assigned unique IDs using UUID v4 (`generateUUID()`)
- Members also use UUID v4 for guaranteed uniqueness
- IDs persist through analysis for proper force mapping
- UUID format: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"

### Stress Failure Detection
```javascript
// In useTrussStore.js
const allowableStress = member.force > 0 ? material.Fb : material.Fc
const ratio = stress / allowableStress
const failedMembers = [] // Track which members fail
```
- Tension members checked against Fb (bending strength)
- Compression members checked against Fc (compression strength)
- Failure when ratio > 1.0 (100%)
- Failed members pulse with red glow animation

### Interactive Features
- **Force Flow Animation**: 2-second cascading animation when analysis runs
- **Node Hover**: Shows coordinates and tooltips
- **Member Selection**: Right-click to delete
- **Support Indicators**: Bright green with glow effect
- **Grid Overlay**: Major lines every 5 units, axis labels in feet
- **Draggable Nodes**: Smooth repositioning with snap-to-grid
- **Snap Indicator**: Crosshairs appear when nodes align with grid
- **Drawing Feedback**: Shows member length while drawing
- **Ghost Nodes**: Preview placement with coordinates

### Building Code Compliance
- Deflection limits: L/240 for roof live load (IBC requirement)
- Uses ASD (Allowable Stress Design) with built-in safety factors
- Material properties from NDS (National Design Specification) tables

## Component Responsibilities

**App.jsx**:
- Main layout with animated gradient background
- Manages grid settings state
- Coordinates between sidebars and canvas

**TrussCanvasClean.jsx**: 
- Manages all canvas interactions and rendering
- Handles builder mode tools and node/member creation
- Implements node dragging with snap-to-grid
- Manages animations (force flow, pulsing failures)
- Receives grid settings from parent
- **Critical**: Clean implementation without comments inside Konva components

**GridSettings.jsx**:
- Controls grid visibility and spacing
- Builder mode toggle and tool selection
- Clear all function
- Located in right sidebar for better UX

**LoadPanel.jsx**: 
- Three sliders for dead/live/snow loads (PSF)
- Triggers `runAnalysis()` on button click
- Shows total load sum with descriptive labels
- Beautiful gradient styling with emojis

**MaterialSelector.jsx**: 
- Dropdown for wood species selection
- Displays material properties (E, Fb, Fc)
- Visual strength comparison bars
- Auto-triggers re-analysis on change

**ResultsPanel.jsx**: 
- Shows PASS/FAIL status with color coding
- Displays stress ratio, deflection ratio
- Lists specific failure reasons
- Shows support reactions in pounds

**SaveLoadPanel.jsx**:
- Save current design to JSON file
- Load previous designs from file
- Includes metadata (name, description, timestamp)
- Version-controlled file format

**PresetSelector.jsx**:
- Quick-load common truss configurations
- 6 built-in templates with proper geometry
- Generates fresh UUIDs for each load
- One-click truss creation

## Tailwind CSS v4 Setup

**IMPORTANT**: This project uses Tailwind CSS v4 which has different configuration:

1. **PostCSS Config** (`postcss.config.js`):
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

2. **CSS Import** (`index.css`):
```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap');
/* Custom styles follow */
```

3. **No tailwind.config.js needed** - Tailwind v4 works out of the box

## React-Konva Critical Requirements

**IMPORTANT**: React-Konva has strict requirements that must be followed:

1. **No non-Konva elements inside Stage/Layer**
   - Only Konva components (Line, Circle, Text, Group, Rect) allowed
   - No React Fragments, divs, or other HTML elements
   - No conditional rendering with && operator directly in Layer

2. **No comments inside Konva components**
   - Comments cause "Text components are not supported" errors
   - Move all comments outside of Stage/Layer components

3. **Use helper functions for clean rendering**
   ```javascript
   const renderGrid = () => (
     <Group>
       {/* Grid elements here */}
     </Group>
   )
   
   return (
     <Stage>
       <Layer>
         {renderGrid()}
       </Layer>
     </Stage>
   )
   ```

4. **Avoid whitespace between elements**
   - Extra whitespace can be interpreted as text nodes
   - Keep JSX elements compact inside Layer

## Performance Optimizations

- Member forces only recalculated when geometry/loads change
- Deflection scale changes don't trigger analysis
- Canvas uses absolute positioning to prevent layout recalculation
- Store actions batched to minimize re-renders
- UUID generation is fast and collision-free

## Testing Approach

The application uses visual testing through the UI:
1. Use Builder Mode to create custom trusses
2. Apply various loads to test structural limits
3. Verify force visualization matches engineering expectations
4. Check for pulsing red glow on failed members
5. Test support reactions sum to total applied load
6. Test save/load functionality preserves exact state
7. Verify presets load correctly with proper forces

## Known Issues & Solutions

### React-Konva Rendering Errors
**Problem**: "Text components are not supported" or "Cannot read properties of undefined"
**Solution**: Created TrussCanvasClean.jsx with:
- No comments inside Stage/Layer
- Helper functions for conditional rendering
- No React Fragments inside Konva components
- Compact JSX without extra whitespace

### Tailwind CSS v4 Not Loading
**Problem**: Styles not applying, plain white background
**Solution**: 
- Use `@import "tailwindcss"` instead of `@tailwind` directives
- Configure PostCSS with `@tailwindcss/postcss` plugin
- No tailwind.config.js file needed

### Grid Disappearing on Template Load
**Problem**: Grid vanishes when selecting preset templates
**Solution**: Proper event handling and state management in TrussCanvasClean

## Known Limitations

- Simplified deflection calculation (not full FEA)
- Single load case analysis (no load combinations)
- 2D analysis only (no out-of-plane buckling)
- Zero-force members correctly show 0 lbs (not a bug)
- Method of Joints requires determinate structures

## Development Tips

1. **When modifying canvas components**: Always check for React-Konva compliance
2. **For UI changes**: Use Tailwind v4 classes with glassmorphism effects
3. **Adding new features**: Follow existing patterns in TrussCanvasClean
4. **Debugging canvas issues**: Check browser console for Konva-specific errors
5. **Performance**: Batch state updates and avoid unnecessary re-renders