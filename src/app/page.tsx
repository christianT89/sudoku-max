import Link from 'next/link'

const actions = [
  {
    href: '/daily',
    title: 'Play daily Sudoku',
    description: 'Take on a fresh puzzle chosen for today.',
    label: 'Play now'
  },
  {
    href: '/solve',
    title: 'Solve a Sudoku',
    description: 'Upload a picture of any Sudoku and get help solving it.',
    label: 'Solve a puzzle'
  }
]

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-4xl text-center">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-indigo-600">Sudoku Max</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">Your next puzzle is ready.</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Play the daily challenge or use a photo to solve a Sudoku you already have.
        </p>
        <div className="mt-12 grid gap-6 text-left md:grid-cols-2">
          {actions.map((action) => (
            <Link
              className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-200"
              href={action.href}
              key={action.href}
            >
              <h2 className="text-2xl font-semibold text-slate-900">{action.title}</h2>
              <p className="mt-3 min-h-12 leading-6 text-slate-600">{action.description}</p>
              <span className="mt-8 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition group-hover:bg-indigo-700">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
