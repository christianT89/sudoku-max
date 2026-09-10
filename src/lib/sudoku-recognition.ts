import { sudokuGridSchema, type SudokuGrid } from './sudoku-grid'

const createEmptyGrid = (): SudokuGrid => Array.from({ length: 9 }, () => Array(9).fill(0))

/**
 * Loads an image File into an HTMLCanvasElement in browser environment.
 */
const loadImageToCanvas = (file: File): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas 2D context is not supported.'))
        return
      }
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }
    img.src = url
  })
}

export interface RecognitionOptions {
  debug?: boolean
  onDebugUpdate?: (images: string[]) => void
}

export const recognizeSudoku = async (
  image: File,
  options: RecognitionOptions = {}
): Promise<SudokuGrid> => {
  const canvas = await loadImageToCanvas(image)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Could not get canvas context')
  }

  const { width, height } = canvas
  const imgData = ctx.getImageData(0, 0, width, height)
  const raw = imgData.data

  const isDarkPixel = (x: number, y: number) => {
    const idx = (y * width + x) * 4
    const r = raw[idx]
    const g = raw[idx + 1]
    const b = raw[idx + 2]
    return 0.299 * r + 0.587 * g + 0.114 * b < 120
  }

  // Scan row/column dark pixel counts to locate the outer grid lines
  const rowDarkCounts: number[] = new Array(height).fill(0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isDarkPixel(x, y)) rowDarkCounts[y]++
    }
  }

  const colDarkCounts: number[] = new Array(width).fill(0)
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (isDarkPixel(x, y)) colDarkCounts[x]++
    }
  }

  // Find outer border lines (lines with high density of dark pixels)
  const topY = rowDarkCounts.findIndex((count) => count > width * 0.4)
  const bottomY = rowDarkCounts.length - 1 - [...rowDarkCounts].reverse().findIndex((count) => count > width * 0.4)
  const leftX = colDarkCounts.findIndex((count) => count > height * 0.4)
  const rightX = colDarkCounts.length - 1 - [...colDarkCounts].reverse().findIndex((count) => count > height * 0.4)

  const hasValidBorder =
    topY !== -1 &&
    bottomY !== -1 &&
    leftX !== -1 &&
    rightX !== -1 &&
    rightX > leftX + 50 &&
    bottomY > topY + 50

  const gridLeft = hasValidBorder ? leftX : 0
  const gridTop = hasValidBorder ? topY : 0
  const gridRight = hasValidBorder ? rightX : width - 1
  const gridBottom = hasValidBorder ? bottomY : height - 1

  const gridW = gridRight - gridLeft
  const gridH = gridBottom - gridTop
  const cellW = gridW / 9
  const cellH = gridH / 9

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')

  await worker.setParameters({
    tessedit_char_whitelist: '123456789',
    // PSM 10 = Single character
    // @ts-ignore - PSM enum value
    tessedit_pageseg_mode: '10',
  })

  const grid = createEmptyGrid()
  const debugImages: string[] = []
  let cluesFound = 0

  try {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellX = gridLeft + c * cellW
        const cellY = gridTop + r * cellH
        const innerX = Math.floor(cellX + cellW * 0.18)
        const innerY = Math.floor(cellY + cellH * 0.18)
        const innerW = Math.floor(cellW * 0.64)
        const innerH = Math.floor(cellH * 0.64)

        if (innerW <= 0 || innerH <= 0) {
          if (options.debug) debugImages.push('')
          continue
        }

        // Check dark pixel count in the inner cell region
        let darkCount = 0
        const cellCanvas = document.createElement('canvas')
        cellCanvas.width = innerW
        cellCanvas.height = innerH
        const cellCtx = cellCanvas.getContext('2d')
        if (!cellCtx) {
          if (options.debug) debugImages.push('')
          continue
        }

        const cellImgData = cellCtx.createImageData(innerW, innerH)
        const cellData = cellImgData.data

        for (let iy = 0; iy < innerH; iy++) {
          for (let ix = 0; ix < innerW; ix++) {
            const px = Math.min(width - 1, Math.max(0, innerX + ix))
            const py = Math.min(height - 1, Math.max(0, innerY + iy))
            const idx = (py * width + px) * 4
            const rVal = raw[idx]
            const gVal = raw[idx + 1]
            const bVal = raw[idx + 2]
            const lum = 0.299 * rVal + 0.587 * gVal + 0.114 * bVal

            const dstIdx = (iy * innerW + ix) * 4
            if (lum < 120) {
              darkCount++
              cellData[dstIdx] = 0
              cellData[dstIdx + 1] = 0
              cellData[dstIdx + 2] = 0
              cellData[dstIdx + 3] = 255
            } else {
              cellData[dstIdx] = 255
              cellData[dstIdx + 1] = 255
              cellData[dstIdx + 2] = 255
              cellData[dstIdx + 3] = 255
            }
          }
        }

        cellCtx.putImageData(cellImgData, 0, 0)
        if (options.debug) {
          debugImages.push(cellCanvas.toDataURL())
        }

        // If dark pixel count is small, the cell is empty
        if (darkCount < 20) {
          grid[r][c] = 0
          continue
        }

        // Run OCR on the thresholded digit
        const { data } = (await worker.recognize(cellCanvas)) as any
        const text = data.text.trim()
        let val = parseInt(text, 10)

        if (isNaN(val) || val < 1 || val > 9) {
          const symText = data.symbols?.[0]?.text?.trim()
          if (symText) {
            val = parseInt(symText, 10)
          }
        }

        if (!isNaN(val) && val >= 1 && val <= 9) {
          grid[r][c] = val
          cluesFound++
        }
      }
    }

    if (options.debug && options.onDebugUpdate) {
      options.onDebugUpdate(debugImages)
    }

    if (cluesFound === 0) {
      throw new Error('No Sudoku clues were found. Use a clear picture of the grid.')
    }

    const parsedGrid = sudokuGridSchema.safeParse(grid)
    if (!parsedGrid.success) {
      throw new Error('The detected Sudoku grid is invalid.')
    }

    return parsedGrid.data
  } finally {
    await worker.terminate()
  }
}
