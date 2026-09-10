import { z } from 'zod'

const sudokuCellSchema = z.number().int().min(0).max(9)

export const sudokuGridSchema = z.array(z.array(sudokuCellSchema).length(9)).length(9)

export type SudokuGrid = z.infer<typeof sudokuGridSchema>
