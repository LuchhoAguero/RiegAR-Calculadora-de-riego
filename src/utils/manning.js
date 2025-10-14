// Manning formula utilities and geometry helpers
export const manningQ = ({ A, P, n, S }) => {
  if (A <= 0 || P <= 0 || n <= 0 || S <= 0) return 0
  const R = A / P
  return (1 / n) * A * Math.pow(R, 2/3) * Math.sqrt(S)
}

export const toFixed = (x, digits=6) => {
  return Number.parseFloat(x || 0).toFixed(digits)
}

// Geometry helpers
export const geometries = {
  rectangular: ({ b, h }) => {
    const A = b * h
    const P = b + 2*h
    return { A, P }
  },
  triangular: ({ h, z }) => {
    // side slope z:1 => top width = 2*z*h
    const A = z * h * h
    const P = 2*h*Math.sqrt(1 + z*z)
    return { A, P }
  },
  trapezoidal: ({ b, h, z }) => {
    const A = b*h + z*h*h
    const P = b + 2*h*Math.sqrt(1 + z*z)
    return { A, P }
  }
}
