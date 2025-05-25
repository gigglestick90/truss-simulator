// Standard lumber sizes with actual dimensions and properties
// All dimensions in inches, areas in sq in, moment of inertia in in^4

export const lumberSizes = [
  // Standard dimensional lumber (typically for residential)
  {
    name: '2x4',
    category: 'Dimensional',
    nominalWidth: 2,
    nominalHeight: 4,
    actualWidth: 1.5,
    actualHeight: 3.5,
    area: 5.25,
    momentOfInertia: 5.36,  // I = (1.5*3.5^3)/12
    weight: 1.09  // pounds per foot
  },
  {
    name: '2x6',
    category: 'Dimensional',
    nominalWidth: 2,
    nominalHeight: 6,
    actualWidth: 1.5,
    actualHeight: 5.5,
    area: 8.25,
    momentOfInertia: 20.80,  // I = (1.5*5.5^3)/12
    weight: 1.72  // pounds per foot
  },
  {
    name: '2x8',
    category: 'Dimensional',
    nominalWidth: 2,
    nominalHeight: 8,
    actualWidth: 1.5,
    actualHeight: 7.25,
    area: 10.875,
    momentOfInertia: 47.63,  // I = (1.5*7.25^3)/12
    weight: 2.26  // pounds per foot
  },
  {
    name: '2x10',
    category: 'Dimensional',
    nominalWidth: 2,
    nominalHeight: 10,
    actualWidth: 1.5,
    actualHeight: 9.25,
    area: 13.875,
    momentOfInertia: 98.93,  // I = (1.5*9.25^3)/12
    weight: 2.89  // pounds per foot
  },
  {
    name: '2x12',
    category: 'Dimensional',
    nominalWidth: 2,
    nominalHeight: 12,
    actualWidth: 1.5,
    actualHeight: 11.25,
    area: 16.875,
    momentOfInertia: 177.98,  // I = (1.5*11.25^3)/12
    weight: 3.51  // pounds per foot
  },
  
  // Single-ply timber sizes (minimum for roof trusses)
  {
    name: '4x6',
    category: 'Timber',
    nominalWidth: 4,
    nominalHeight: 6,
    actualWidth: 3.5,
    actualHeight: 5.5,
    area: 19.25,
    momentOfInertia: 48.53,  // I = (3.5*5.5^3)/12
    weight: 4.01  // pounds per foot
  },
  {
    name: '4x8',
    category: 'Timber',
    nominalWidth: 4,
    nominalHeight: 8,
    actualWidth: 3.5,
    actualHeight: 7.25,
    area: 25.375,
    momentOfInertia: 111.15,  // I = (3.5*7.25^3)/12
    weight: 5.28  // pounds per foot
  },
  {
    name: '4x10',
    category: 'Timber',
    nominalWidth: 4,
    nominalHeight: 10,
    actualWidth: 3.5,
    actualHeight: 9.25,
    area: 32.375,
    momentOfInertia: 230.84,  // I = (3.5*9.25^3)/12
    weight: 6.74  // pounds per foot
  },
  {
    name: '4x12',
    category: 'Timber',
    nominalWidth: 4,
    nominalHeight: 12,
    actualWidth: 3.5,
    actualHeight: 11.25,
    area: 39.375,
    momentOfInertia: 415.28,  // I = (3.5*11.25^3)/12
    weight: 8.20  // pounds per foot
  },
  
  // Larger timber sizes for heavy loads
  {
    name: '6x8',
    category: 'Heavy Timber',
    nominalWidth: 6,
    nominalHeight: 8,
    actualWidth: 5.5,
    actualHeight: 7.5,
    area: 41.25,
    momentOfInertia: 193.36,  // I = (5.5*7.5^3)/12
    weight: 8.59  // pounds per foot
  },
  {
    name: '6x10',
    category: 'Heavy Timber',
    nominalWidth: 6,
    nominalHeight: 10,
    actualWidth: 5.5,
    actualHeight: 9.5,
    area: 52.25,
    momentOfInertia: 392.96,  // I = (5.5*9.5^3)/12
    weight: 10.88  // pounds per foot
  },
  {
    name: '6x12',
    category: 'Heavy Timber',
    nominalWidth: 6,
    nominalHeight: 12,
    actualWidth: 5.5,
    actualHeight: 11.5,
    area: 63.25,
    momentOfInertia: 697.07,  // I = (5.5*11.5^3)/12
    weight: 13.17  // pounds per foot
  },
  {
    name: '8x10',
    category: 'Heavy Timber',
    nominalWidth: 8,
    nominalHeight: 10,
    actualWidth: 7.5,
    actualHeight: 9.5,
    area: 71.25,
    momentOfInertia: 535.86,  // I = (7.5*9.5^3)/12
    weight: 14.84  // pounds per foot
  },
  {
    name: '8x12',
    category: 'Heavy Timber',
    nominalWidth: 8,
    nominalHeight: 12,
    actualWidth: 7.5,
    actualHeight: 11.5,
    area: 86.25,
    momentOfInertia: 950.55,  // I = (7.5*11.5^3)/12
    weight: 17.97  // pounds per foot
  },
  
  // Extra large timber/glulam sizes for special applications
  {
    name: '4x24',
    category: 'Glulam/Special',
    nominalWidth: 4,
    nominalHeight: 24,
    actualWidth: 3.5,
    actualHeight: 23.25,
    area: 81.375,
    momentOfInertia: 3660.99,  // I = (3.5*23.25^3)/12
    weight: 16.95  // pounds per foot
  },
  {
    name: '8x24',
    category: 'Glulam/Special',
    nominalWidth: 8,
    nominalHeight: 24,
    actualWidth: 7.5,
    actualHeight: 23.25,
    area: 174.375,
    momentOfInertia: 7843.19,  // I = (7.5*23.25^3)/12
    weight: 36.32  // pounds per foot
  },
  {
    name: '8x48',
    category: 'Glulam/Special',
    nominalWidth: 8,
    nominalHeight: 48,
    actualWidth: 7.5,
    actualHeight: 47.25,
    area: 354.375,
    momentOfInertia: 65908.63,  // I = (7.5*47.25^3)/12
    weight: 73.83  // pounds per foot
  }
]

// Default lumber size
export const defaultLumberSize = lumberSizes[0] // 2x4