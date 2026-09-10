import { sudokuGridSchema, type SudokuGrid } from './sudoku-grid'

const createEmptyGrid = (): SudokuGrid => Array.from({ length: 9 }, () => Array(9).fill(0))

export const recognizeSudoku = async (image: File): Promise<SudokuGrid> => {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')

  try {
    const { data } = await worker.recognize(image)
    const words = (data.blocks ?? [])
      .flatMap((block) => block.paragraphs)
      .flatMap((paragraph) => paragraph.lines)
      .flatMap((line) => line.words)
      .filter(({ text }) => /^[1-9]$/.test(text.trim()))

    if (words.length === 0) {
      throw new Error('No Sudoku clues were found. Use a clear, tightly cropped picture of the grid.')
    }

    const left = Math.min(...words.map(({ bbox }) => bbox.x0))
    const top = Math.min(...words.map(({ bbox }) => bbox.y0))
    const right = Math.max(...words.map(({ bbox }) => bbox.x1))
    const bottom = Math.max(...words.map(({ bbox }) => bbox.y1))
    const grid = createEmptyGrid()

    words.forEach(({ text, bbox }) => {
      const column = Math.min(8, Math.max(0, Math.floor(((bbox.x0 + bbox.x1) / 2 - left) / (right - left) * 9)))
      const row = Math.min(8, Math.max(0, Math.floor(((bbox.y0 + bbox.y1) / 2 - top) / (bottom - top) * 9)))
      grid[row][column] = Number(text)
    })

    const parsedGrid = sudokuGridSchema.safeParse(grid)

    if (!parsedGrid.success) {
      throw new Error('The detected Sudoku grid is invalid.')
    }

    return parsedGrid.data
  } finally {
    await worker.terminate()
  }
}
