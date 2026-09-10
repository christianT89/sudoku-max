import Link from 'next/link'

export default function SolveSudokuPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <Link className="text-sm font-semibold text-indigo-600 hover:text-indigo-800" href="/">← Back home</Link>
      <section className="my-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Sudoku solver</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Solve a Sudoku from a picture</h1>
        <p className="mt-4 text-lg leading-7 text-slate-600">Photo upload and puzzle recognition will appear here.</p>
      </section>
    </main>
  )
}
