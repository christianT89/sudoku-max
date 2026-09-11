import type { SudokuGrid } from './sudoku-grid'

const cellSize = 64
const boardSize = cellSize * 9

export const createSolvedSudokuSvg = (puzzle: SudokuGrid, solution: SudokuGrid) => {
  const lines = Array.from({ length: 10 }, (_, index) => {
    const position = index * cellSize
    const strokeWidth = index % 3 === 0 ? 3 : 1

    return `<path d="M ${position} 0 V ${boardSize} M 0 ${position} H ${boardSize}" stroke="#334155" stroke-width="${strokeWidth}" />`
  }).join('')

  const cells = solution.flatMap((row, rowIndex) => row.map((value, columnIndex) => {
    const isGiven = puzzle[rowIndex][columnIndex] !== 0
    const x = columnIndex * cellSize + cellSize / 2
    const y = rowIndex * cellSize + cellSize / 2 + 10
    const color = isGiven ? '#0f172a' : '#4f46e5'

    return `<text x="${x}" y="${y}" fill="${color}" font-family="Arial, sans-serif" font-size="30" font-weight="700" text-anchor="middle">${value}</text>`
  })).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boardSize} ${boardSize}" role="img" aria-label="Solved Sudoku"><rect width="100%" height="100%" fill="#ffffff" />${lines}${cells}</svg>`
}

export const svgToDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
