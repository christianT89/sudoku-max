'use client'

/* eslint-disable @next/next/no-img-element -- The preview uses local blob and SVG data URLs. */

import { ChangeEvent, useEffect, useState } from 'react'
import { createSolvedSudokuSvg, svgToDataUrl } from '@/lib/sudoku-image'
import { recognizeSudoku } from '@/lib/sudoku-recognition'
import { solveSudoku } from '@/lib/sudoku-solver'

export const SudokuPhotoSolver = () => {
  const [file, setFile] = useState<File | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [solutionUrl, setSolutionUrl] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [debugImages, setDebugImages] = useState<string[]>([])

  useEffect(() => () => {
    if (sourceUrl) {
      URL.revokeObjectURL(sourceUrl)
    }
  }, [sourceUrl])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null

    setFile(nextFile)
    setSolutionUrl(null)
    setMessage(null)
    setDebugImages([])
    setSourceUrl(nextFile ? URL.createObjectURL(nextFile) : null)
  }

  const handleSolve = async () => {
    if (!file) {
      setMessage('Choose a Sudoku image before generating a solution.')
      return
    }

    setIsProcessing(true)
    setMessage('Reading the clues and solving the Sudoku…')
    setDebugImages([])

    try {
      const puzzle = await recognizeSudoku(file, {
        debug: debugMode,
        onDebugUpdate: setDebugImages
      })
      const solution = solveSudoku(puzzle)

      if (!solution) {
        throw new Error('This Sudoku could not be solved. Try a clearer, tightly cropped image.')
      }

      setSolutionUrl(svgToDataUrl(createSolvedSudokuSvg(puzzle, solution)))
      setMessage('Solved. Dark numbers came from your puzzle; purple numbers were added by Sudoku Max.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not solve that image.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <label className="block rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 p-6 text-center cursor-pointer">
        <span className="block font-semibold text-slate-900">Upload a Sudoku picture</span>
        <span className="mt-1 block text-sm text-slate-600">For best results, crop the photo to the Sudoku grid.</span>
        <input className="sr-only" accept="image/*" onChange={handleFileChange} type="file" />
        <span className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm">Choose image</span>
      </label>

      <div className="flex items-center gap-2">
        <input 
          id="debug-mode" 
          type="checkbox" 
          checked={debugMode} 
          onChange={(e) => setDebugMode(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
        />
        <label htmlFor="debug-mode" className="text-sm font-medium text-slate-700">
          Enable Debug Mode (show extracted cells)
        </label>
      </div>

      <button className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400" disabled={!file || isProcessing} onClick={handleSolve} type="button">
        {isProcessing ? 'Solving…' : 'Generate solved Sudoku'}
      </button>

      {message && <p aria-live="polite" className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">{message}</p>}

      {debugImages.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900 uppercase tracking-wider">Debug: Extracted Cells</h3>
          <div className="grid grid-cols-9 gap-1">
            {debugImages.map((src, i) => (
              <div key={i} className="aspect-square bg-white border border-slate-300 flex items-center justify-center overflow-hidden">
                {src ? (
                  <img src={src} alt={`Cell ${i}`} className="w-full h-full object-contain image-pixelated" />
                ) : (
                  <div className="w-full h-full bg-slate-100" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(sourceUrl || solutionUrl) && (
        <div className="grid gap-6 md:grid-cols-2">
          {sourceUrl && <figure><img alt="Uploaded Sudoku" className="aspect-square w-full rounded-lg border border-slate-200 object-contain" src={sourceUrl} /><figcaption className="mt-2 text-sm text-slate-600">Uploaded puzzle</figcaption></figure>}
          {solutionUrl && <figure><img alt="Solved Sudoku with original clues in dark text and added answers in purple" className="aspect-square w-full rounded-lg border border-slate-200" src={solutionUrl} /><figcaption className="mt-2 text-sm text-slate-600">Generated solution</figcaption></figure>}
        </div>
      )}
    </div>
  )
}
