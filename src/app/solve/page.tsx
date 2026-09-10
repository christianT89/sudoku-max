import Link from 'next/link'
import { SudokuPhotoSolver } from '@/components/sudoku-photo-solver'

export default function SolveSudokuPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" href="/">← Back home</Link>
      <section className="my-12 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Sudoku solver</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Solve a Sudoku from a picture</h1>
        <p className="mt-4 text-lg leading-7 text-slate-600">Upload a clear picture of a Sudoku. We will read its clues, solve it, and create a color-coded solution image.</p>
        <SudokuPhotoSolver />
      </section>
    </main>
  )
}
