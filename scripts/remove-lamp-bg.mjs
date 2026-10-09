import sharp from 'sharp'
import fs from 'fs'

async function processImages() {
  const inputLamp = 'C:\\Users\\yuvan\\.gemini\\antigravity-ide\\brain\\619b010e-f021-4266-a045-6bb7a6dec4ce\\hanging_brass_deepams_1791467188855.jpg'
  const outputLamp = './public/images/hero-hanging-deepams.png'

  const { data, info } = await sharp(inputLamp)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const outputData = Buffer.alloc(width * height * 4)

  // Extract background color sample from corners
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels
      const outIdx = (y * width + x) * 4

      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]

      outputData[outIdx] = r
      outputData[outIdx + 1] = g
      outputData[outIdx + 2] = b

      // Detect warm cream/beige background
      // Background in input image is around rgb(240..250, 225..245, 205..230)
      const isWarmBg = (r > 200 && g > 185 && b > 165 && Math.abs(r - g) < 35 && Math.abs(g - b) < 35)
      const diffFromBg = Math.sqrt(Math.pow(r - 238, 2) + Math.pow(g - 224, 2) + Math.pow(b - 206, 2))

      if (isWarmBg && diffFromBg < 35) {
        outputData[outIdx + 3] = 0 // fully transparent
      } else if (isWarmBg && diffFromBg < 60) {
        const alpha = Math.floor(((diffFromBg - 35) / 25) * 255)
        outputData[outIdx + 3] = Math.max(0, Math.min(255, alpha))
      } else {
        outputData[outIdx + 3] = 255
      }
    }
  }

  await sharp(outputData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputLamp)

  console.log('Saved transparent hanging lamps to:', outputLamp)

  // Copy clean Gopuram etching (no text)
  const cleanGopuram = 'C:\\Users\\yuvan\\.gemini\\antigravity-ide\\brain\\619b010e-f021-4266-a045-6bb7a6dec4ce\\clean_gopuram_etching_1791467744903.jpg'
  fs.copyFileSync(cleanGopuram, './public/images/bg-gopuram-etching.jpg')
  console.log('Updated clean gopuram etching without text')

  // Copy clean Lotus etching (no text)
  const cleanLotus = 'C:\\Users\\yuvan\\.gemini\\antigravity-ide\\brain\\619b010e-f021-4266-a045-6bb7a6dec4ce\\clean_lotus_etching_1791467778298.jpg'
  fs.copyFileSync(cleanLotus, './public/images/bg-lotus-etching.jpg')
  console.log('Updated clean lotus etching without text')
}

processImages().catch(console.error)
