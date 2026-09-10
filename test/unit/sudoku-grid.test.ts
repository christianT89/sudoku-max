import { describe, expect, it } from 'vitest'
import { sudokuGridSchema } from '../../src/lib/sudoku-grid'

describe('sudokuGridSchema', () => {
  it('accepts a 9 by 9 grid with values from zero to nine', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0))

    expect(sudokuGridSchema.safeParse(grid).success).toBe(true)
  })

  it('rejects a cell outside the Sudoku range', () => {
    const grid = Array.from({ length: 9 }, () => Array(9).fill(0))
    grid[0][0] = 10

    expect(sudokuGridSchema.safeParse(grid).success).toBe(false)
  })
})
