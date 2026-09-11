import { describe, expect, it } from 'vitest'
import { createSolvedSudokuSvg } from '../../src/lib/sudoku-image'
import { solveSudoku } from '../../src/lib/sudoku-solver'

const puzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9]
]

describe('solveSudoku', () => {
  it('solves a valid Sudoku without changing the original puzzle', () => {
    const solution = solveSudoku(puzzle)

    expect(solution?.[0]).toEqual([5, 3, 4, 6, 7, 8, 9, 1, 2])
    expect(puzzle[0][2]).toBe(0)
  })

  it('creates an image with distinct colors for clues and answers', () => {
    const solution = solveSudoku(puzzle)

    expect(solution).not.toBeNull()

    const svg = createSolvedSudokuSvg(puzzle, solution!)

    expect(svg).toContain('fill="#0f172a"')
    expect(svg).toContain('fill="#4f46e5"')
  })
})
