import sharp from 'sharp'
import fs from 'fs'

async function removeBackground() {
  const inputPath = 'C:\\Users\\yuvan\\.gemini\\antigravity-ide\\brain\\619b010e-f021-4266-a045-6bb7a6dec4ce\\hanging_brass_deepams_1791467188855.jpg'
  const outputPath = './public/images/hero-hanging-deepams.png'

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info
  const visited = new Uint8Array(width * height)
  const isBg = new Uint8Array(width * height)

  // A pixel is background if it is close to the warm beige wall color:
  // Typical wall: high R (180-255), medium-high G (150-230), medium B (110-190), with R > G > B
  function isWallColor(r, g, b) {
    // Brass is either very dark (shadows r<100), or very rich gold/brown with r-b > 70 or low b < 100, or flame (very bright yellow/white r>240, g>220, b>160)
    // Wall color is smooth muted beige:
    const rg = r - g
    const gb = g - b
    const rb = r - b

    // Wall characteristics in this image:
    // r is around 200..245, g is around 170..215, b is around 125..175
    // rg is between 20 and 40, gb is between 30 and 55
    if (r > 175 && g > 145 && b > 105 && rg >= 12 && rg <= 50 && gb >= 18 && gb <= 65 && rb >= 35 && rb <= 105) {
      return true
    }
    return false
  }

  // Flood fill from border
  const queue = []

  // Add all edge pixels
  for (let x = 0; x < width; x++) {
    queue.push(0 * width + x)
    queue.push((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    queue.push(y * width + 0)
    queue.push(y * width + (width - 1))
  }

  while (queue.length > 0) {
    const idx = queue.pop()
    if (visited[idx]) continue
    visited[idx] = 1

    const x = idx % width
    const y = Math.floor(idx / width)
    const pIdx = idx * channels

    const r = data[pIdx]
    const g = data[pIdx + 1]
    const b = data[pIdx + 2]

    if (isWallColor(r, g, b)) {
      isBg[idx] = 1

      // add neighbors
      if (x > 0 && !visited[idx - 1]) queue.push(idx - 1)
      if (x < width - 1 && !visited[idx + 1]) queue.push(idx + 1)
      if (y > 0 && !visited[idx - width]) queue.push(idx - width)
      if (y < height - 1 && !visited[idx + width]) queue.push(idx + width)
    }
  }

  // Also flood fill non-visited small enclosed areas that have wall color
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const pIdx = idx * channels
      const r = data[pIdx]
      const g = data[pIdx + 1]
      const b = data[pIdx + 2]
      if (!isBg[idx] && isWallColor(r, g, b)) {
        isBg[idx] = 1
      }
    }
  }

  // Build 4-channel PNG
  const outputData = Buffer.alloc(width * height * 4)
  for (let idx = 0; idx < width * height; idx++) {
    const inIdx = idx * channels
    const outIdx = idx * 4

    outputData[outIdx] = data[inIdx]
    outputData[outIdx + 1] = data[inIdx + 1]
    outputData[outIdx + 2] = data[inIdx + 2]

    if (isBg[idx]) {
      outputData[outIdx + 3] = 0 // Transparent
    } else {
      outputData[outIdx + 3] = 255 // Opaque lamp
    }
  }

  await sharp(outputData, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath)

  console.log('Successfully saved transparent PNG to:', outputPath)
}

removeBackground().catch(console.error)
