export const WOOD_SPECIES = {
  'Hem-Fir #2': {
    E: 1_300_000,  // psi - Modulus of Elasticity
    Fb: 850,       // psi - Allowable bending stress
    Fc: 1250,      // psi - Allowable compression parallel to grain (corrected)
    density: 28    // pcf
  },
  'Douglas Fir-Larch #2': {
    E: 1_600_000,
    Fb: 875,       // Corrected from 900
    Fc: 1300,      // Corrected from 1350
    density: 32
  },
  'Southern Pine #2': {
    E: 1_600_000,  // Corrected from 1_400_000
    Fb: 1000,      // Note: varies by size in actual NDS
    Fc: 1650,
    density: 36
  },
  'SPF (Spruce-Pine-Fir) #2': {
    E: 1_200_000,
    Fb: 875,       // Corrected from 775 (using SPF-South values)
    Fc: 1150,      // Note: actual values vary significantly by region
    density: 26
  }
}

export const LUMBER_SIZES = {
  '2x4': {
    width: 1.5,
    height: 3.5,
    area: 5.25,  // sq in
  },
  '2x6': {
    width: 1.5,
    height: 5.5,
    area: 8.25,
  },
  '2x8': {
    width: 1.5,
    height: 7.25,
    area: 10.875,
  },
  '2x10': {
    width: 1.5,
    height: 9.25,
    area: 13.875,
  },
  '2x12': {
    width: 1.5,
    height: 11.25,
    area: 16.875,
  }
}