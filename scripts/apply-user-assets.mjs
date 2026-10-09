import sharp from 'sharp'
import fs from 'fs'

async function updateAssets() {
  // 1. Copy user's transparent hanging deepams PNG
  const userLamp = 'C:\\Users\\yuvan\\.gemini\\antigravity-ide\\brain\\619b010e-f021-4266-a045-6bb7a6dec4ce\\.user_uploaded\\media_1791468459457.png'
  fs.copyFileSync(userLamp, './public/images/hero-hanging-deepams.png')
  console.log('Copied user transparent lamps to public/images/hero-hanging-deepams.png')

  // 2. Crop Tanjavur temple etching to preserve the temple while removing bottom caption
  const origTanjavur = 'C:\\Users\\yuvan\\.gemini\\antigravity-ide\\brain\\619b010e-f021-4266-a045-6bb7a6dec4ce\\heritage_gopuram_etching_1791466823386.jpg'
  const meta = await sharp(origTanjavur).metadata()
  
  // Crop out bottom 11% which contains the text caption
  const cropHeight = Math.floor(meta.height * 0.885)
  await sharp(origTanjavur)
    .extract({ left: 0, top: 0, width: meta.width, height: cropHeight })
    .jpeg({ quality: 95 })
    .toFile('./public/images/bg-gopuram-etching.jpg')
  
  console.log('Saved cropped Tanjavur temple etching without text to public/images/bg-gopuram-etching.jpg')
}

updateAssets().catch(console.error)
