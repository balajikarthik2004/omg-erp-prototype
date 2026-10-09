import sharp from 'sharp'
import fs from 'fs'

async function prepareTanjavur() {
  const tanjavurSrc = 'C:\\Users\\yuvan\\.gemini\\antigravity-ide\\brain\\619b010e-f021-4266-a045-6bb7a6dec4ce\\heritage_gopuram_etching_1791466823386.jpg'
  const target = './public/images/bg-gopuram-etching.jpg'

  const meta = await sharp(tanjavurSrc).metadata()
  // Crop out the text caption from the bottom 11.5%
  const cropH = Math.floor(meta.height * 0.885)

  await sharp(tanjavurSrc)
    .extract({ left: 0, top: 0, width: meta.width, height: cropH })
    .jpeg({ quality: 95 })
    .toFile(target)

  console.log('Successfully saved Thanjavur temple etching (without caption) to:', target)
}

prepareTanjavur().catch(console.error)
