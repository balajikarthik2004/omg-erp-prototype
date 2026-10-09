import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

/**
 * Converts pencil / copperplate etchings on paper into crisp transparent PNGs.
 * Removes all paper backgrounds, edge artifacts, and bounding boxes.
 */
async function makeEtchingTransparent(inputPath, outputPath, options = {}) {
  const {
    whiteThreshold = 242,
    blackThreshold = 40,
    gamma = 1.0,
    edgeFeather = 15,
    inkColor = [70, 48, 32], // Rich warm sepia/charcoal ink
    cropBottom = 0,
  } = options

  console.log(`Processing: ${inputPath} -> ${outputPath}`)

  let pipeline = sharp(inputPath)

  if (cropBottom > 0) {
    const meta = await pipeline.metadata()
    const cropH = Math.floor(meta.height * (1 - cropBottom))
    pipeline = pipeline.extract({ left: 0, top: 0, width: meta.width, height: cropH })
  }

  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  const outBuffer = Buffer.alloc(width * height * 4)

  // Find average edge white level to adaptively adjust threshold if needed
  let edgeSum = 0
  let edgeCount = 0
  for (let x = 0; x < width; x++) {
    for (const y of [0, 1, 2, height - 3, height - 2, height - 1]) {
      const idx = (y * width + x) * channels
      const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      edgeSum += lum
      edgeCount++
    }
  }
  const avgEdgeWhite = edgeSum / edgeCount
  const effectiveWhite = Math.min(whiteThreshold, Math.max(220, avgEdgeWhite - 3))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * channels
      const dstIdx = (y * width + x) * 4

      const r = data[srcIdx]
      const g = data[srcIdx + 1]
      const b = data[srcIdx + 2]

      // Luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b

      let alpha = 0
      if (lum < effectiveWhite) {
        const norm = Math.max(0, Math.min(1, (effectiveWhite - lum) / (effectiveWhite - blackThreshold)))
        alpha = Math.round(255 * Math.pow(norm, gamma))
      }

      // Edge feathering to eliminate any bounding box border
      if (edgeFeather > 0 && alpha > 0) {
        const distToEdge = Math.min(x, width - 1 - x, y, height - 1 - y)
        if (distToEdge < edgeFeather) {
          const featherFactor = distToEdge / edgeFeather
          alpha = Math.round(alpha * featherFactor)
        }
      }

      outBuffer[dstIdx] = inkColor[0]
      outBuffer[dstIdx + 1] = inkColor[1]
      outBuffer[dstIdx + 2] = inkColor[2]
      outBuffer[dstIdx + 3] = alpha
    }
  }

  await sharp(outBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath)

  console.log(`Saved transparent PNG to ${outputPath} (${width}x${height})`)
}

async function main() {
  const images = [
    {
      src: './public/images/bg-gopuram-etching.jpg',
      dst: './public/images/bg-gopuram-etching.png',
      opts: { whiteThreshold: 205, blackThreshold: 30, gamma: 1.15, edgeFeather: 20 },
    },
    {
      src: './public/images/bg-lotus-etching.jpg',
      dst: './public/images/bg-lotus-etching.png',
      opts: { whiteThreshold: 208, blackThreshold: 30, gamma: 1.15, edgeFeather: 20 },
    },
    {
      src: './public/images/bg-project-gopuram-etching.jpg',
      dst: './public/images/bg-project-gopuram-etching.png',
      opts: { whiteThreshold: 205, blackThreshold: 30, gamma: 1.15, edgeFeather: 20 },
    },
    {
      src: './public/images/bg-project-foliage-etching.jpg',
      dst: './public/images/bg-project-foliage-etching.png',
      opts: { whiteThreshold: 208, blackThreshold: 30, gamma: 1.15, edgeFeather: 20 },
    },
    {
      src: './public/images/nandi-shrine-etching.jpg',
      dst: './public/images/nandi-shrine-etching.png',
      opts: { whiteThreshold: 208, blackThreshold: 30, gamma: 1.15, edgeFeather: 15 },
    },
    {
      src: './public/images/hero-mandala-etching.jpg',
      dst: './public/images/hero-mandala-etching.png',
      opts: { whiteThreshold: 208, blackThreshold: 30, gamma: 1.15, edgeFeather: 20 },
    },
  ]

  for (const img of images) {
    if (fs.existsSync(img.src)) {
      await makeEtchingTransparent(img.src, img.dst, img.opts)
    }
  }
}

main().catch(console.error)
