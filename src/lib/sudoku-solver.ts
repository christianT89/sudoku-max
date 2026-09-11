import { sudokuGridSchema, type SudokuGrid } from './sudoku-grid'

const gridSize = 9

const isValidPlacement = (grid: SudokuGrid, row: number, column: number, value: number) => {
  for (let index = 0; index < gridSize; index += 1) {
    if (grid[row][index] === value || grid[index][column] === value) {
      return false
    }
  }

  const boxRow = Math.floor(row / 3) * 3
  const boxColumn = Math.floor(column / 3) * 3

  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
      if (grid[boxRow + rowOffset][boxColumn + columnOffset] === value) {
        return false
      }
    }
  }

  return true
}

const solve = (grid: SudokuGrid): boolean => {
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      if (grid[row][column] !== 0) {
        continue
      }

      for (let value = 1; value <= gridSize; value += 1) {
        if (!isValidPlacement(grid, row, column, value)) {
          continue
        }

        grid[row][column] = value

        if (solve(grid)) {
          return true
        }

        grid[row][column] = 0
      }

      return false
    }
  }

  return true
}

export const solveSudoku = (input: unknown): SudokuGrid | null => {
  const parsedGrid = sudokuGridSchema.safeParse(input)

  if (!parsedGrid.success) {
    return null
  }

  const grid = parsedGrid.data.map((row) => [...row])

  return solve(grid) ? grid : null
}
