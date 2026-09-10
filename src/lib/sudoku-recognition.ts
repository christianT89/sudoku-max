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
  if (!ctx) throw new Error('Could not get canvas context')

  const { width, height } = canvas
  const imgData = ctx.getImageData(0, 0, width, height)
  const raw = imgData.data

  /**
   * Standard grayscale conversion.
   */
  const getLuminance = (x: number, y: number) => {
    const idx = (Math.floor(y) * width + Math.floor(x)) * 4
    return 0.299 * raw[idx] + 0.587 * raw[idx + 1] + 0.114 * raw[idx + 2]
  }

  // Scan row/column dark pixel counts to locate the outer grid lines
  const rowDarkCounts: number[] = new Array(height).fill(0)
  const colDarkCounts: number[] = new Array(width).fill(0)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (getLuminance(x, y) < 150) {
        rowDarkCounts[y]++
        colDarkCounts[x]++
      }
    }
  }

  const findBorder = (counts: number[], limit: number) => {
    const threshold = limit * 0.4
    let start = counts.findIndex(c => c > threshold)
    let end = counts.length - 1 - [...counts].reverse().findIndex(c => c > threshold)
    return { start, end }
  }

  const rows = findBorder(rowDarkCounts, width)
  const cols = findBorder(colDarkCounts, height)

  const hasValidBorder = rows.start !== -1 && cols.start !== -1 && (rows.end - rows.start) > 100
  const gTop = hasValidBorder ? rows.start : 0
  const gBottom = hasValidBorder ? rows.end : height - 1
  const gLeft = hasValidBorder ? cols.start : 0
  const gRight = hasValidBorder ? cols.end : width - 1

  const cellW = (gRight - gLeft) / 9
  const cellH = (gBottom - gTop) / 9

  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng')
  await worker.setParameters({
    tessedit_char_whitelist: '123456789',
    // @ts-ignore
    tessedit_pageseg_mode: '10', // Single character
  })

  const grid = createEmptyGrid()
  const debugImages: string[] = []
  let cluesFound = 0

  try {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const x = gLeft + c * cellW + cellW * 0.18
        const y = gTop + r * cellH + cellH * 0.18
        const w = Math.floor(cellW * 0.64)
        const h = Math.floor(cellH * 0.64)

        if (w <= 0 || h <= 0) {
          if (options.debug) debugImages.push('')
          continue
        }

        const cellCanvas = document.createElement('canvas')
        cellCanvas.width = w
        cellCanvas.height = h
        const cctx = cellCanvas.getContext('2d')
        if (!cctx) {
          if (options.debug) debugImages.push('')
          continue
        }

        // Calculate local min/max to perform contrast stretching
        let localMin = 255
        let localMax = 0
        for (let iy = 0; iy < h; iy++) {
          for (let ix = 0; ix < w; ix++) {
            const l = getLuminance(x + ix, y + iy)
            if (l < localMin) localMin = l
            if (l > localMax) localMax = l
          }
        }

        const cellImgData = cctx.createImageData(w, h)
        let darkCount = 0

        for (let i = 0; i < w * h; i++) {
          const ix = i % w
          const iy = Math.floor(i / w)
          const l = getLuminance(x + ix, y + iy)
          
          let val = 255
          // Only stretch if there's significant local contrast (prevents noise)
          if (localMax - localMin > 30) {
            // Normalize the pixel: localMin becomes 0 (black), localMax becomes 255 (white)
            const normalized = ((l - localMin) / (localMax - localMin)) * 255
            
            // Solid threshold to make digit lines thick and fully black
            val = normalized < 140 ? 0 : 255
          }

          const offset = i * 4
          cellImgData.data[offset] = cellImgData.data[offset + 1] = cellImgData.data[offset + 2] = val
          cellImgData.data[offset + 3] = 255
          if (val === 0) darkCount++
        }

        cctx.putImageData(cellImgData, 0, 0)
        
        // Save raw high-contrast cell canvas for debug display
        if (options.debug) {
          debugImages.push(cellCanvas.toDataURL())
        }

        // Only run OCR if enough dark pixels exist to form a digit
        if (darkCount > 15) {
          // CREATE AN UPSCALED AND PADDED CANVAS FOR OPTIMAL OCR RECOGNITION
          const ocrCanvas = document.createElement('canvas')
          ocrCanvas.width = 100
          ocrCanvas.height = 100
          const ocrCtx = ocrCanvas.getContext('2d')
          if (ocrCtx) {
            ocrCtx.fillStyle = '#ffffff'
            ocrCtx.fillRect(0, 0, 100, 100)
            ocrCtx.imageSmoothingEnabled = false
            // Center and scale the digit with generous white padding
            ocrCtx.drawImage(cellCanvas, 15, 15, 70, 70)
          }

          const { data } = (await worker.recognize(ocrCanvas ? ocrCanvas : cellCanvas)) as any
          const text = data.text.trim()
          let val = parseInt(text, 10)
          if (isNaN(val)) {
            const sym = data.symbols?.[0]?.text?.trim()
            if (sym) val = parseInt(sym, 10)
          }

          if (!isNaN(val) && val >= 1 && val <= 9) {
            grid[r][c] = val
            cluesFound++
          }
        }
      }
    }

    if (options.debug && options.onDebugUpdate) options.onDebugUpdate(debugImages)
    if (cluesFound === 0) throw new Error('No Sudoku clues were detected.')
    return sudokuGridSchema.parse(grid)
  } finally {
    await worker.terminate()
  }
}
