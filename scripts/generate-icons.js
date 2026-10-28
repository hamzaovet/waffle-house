const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputLogo = path.join(__dirname, '../WK.jpeg');

const sizes = [
  { folder: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { folder: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { folder: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { folder: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { folder: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function createIcons() {
  console.log('Generating Waffle House Android icons with seamless ivory & chocolate palette...');

  const masterSize = 512;
  const creamColor = '#f2e1d1';
  const chocoBorder = '#3a2012';

  // Resize logo to fit nicely with breathing room
  const padding = 28;
  const logoInnerSize = masterSize - padding * 2; // 456

  const resizedLogo = await sharp(inputLogo)
    .resize(logoInnerSize, logoInnerSize, { fit: 'contain', background: creamColor })
    .toBuffer();

  // Create square launcher with seamless cream background and subtle border
  const baseBg = await sharp({
    create: {
      width: masterSize,
      height: masterSize,
      channels: 4,
      background: creamColor
    }
  })
  .composite([
    {
      input: resizedLogo,
      top: padding,
      left: padding
    },
    {
      input: Buffer.from(`
        <svg width="${masterSize}" height="${masterSize}">
          <rect x="2" y="2" width="${masterSize - 4}" height="${masterSize - 4}" rx="80" ry="80" fill="none" stroke="${chocoBorder}" stroke-width="6" stroke-opacity="0.3"/>
        </svg>
      `),
      top: 0,
      left: 0
    }
  ])
  .png()
  .toBuffer();

  // Save master public icon
  const publicIconPath = path.join(__dirname, '../public/app-icon.png');
  await sharp(baseBg).toFile(publicIconPath);
  console.log('✓ Created public/app-icon.png (512x512)');

  // Create Circular Launcher Icon (Round mask)
  const circleMask = Buffer.from(`
    <svg width="${masterSize}" height="${masterSize}">
      <circle cx="${masterSize / 2}" cy="${masterSize / 2}" r="${masterSize / 2 - 2}" fill="#ffffff"/>
    </svg>
  `);

  const roundIcon = await sharp(baseBg)
    .composite([
      { input: circleMask, blend: 'dest-in' },
      {
        input: Buffer.from(`
          <svg width="${masterSize}" height="${masterSize}">
            <circle cx="${masterSize / 2}" cy="${masterSize / 2}" r="${masterSize / 2 - 4}" fill="none" stroke="${chocoBorder}" stroke-width="6" stroke-opacity="0.35"/>
          </svg>
        `),
        top: 0,
        left: 0
      }
    ])
    .png()
    .toBuffer();

  // Generate for all Android densities
  const resDir = path.join(__dirname, '../android/app/src/main/res');

  for (const { folder, size, fgSize } of sizes) {
    const targetFolder = path.join(resDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // 1. Standard launcher icon
    await sharp(baseBg)
      .resize(size, size)
      .toFile(path.join(targetFolder, 'ic_launcher.png'));

    // 2. Round launcher icon
    await sharp(roundIcon)
      .resize(size, size)
      .toFile(path.join(targetFolder, 'ic_launcher_round.png'));

    // 3. Adaptive Foreground Icon
    const fgLogo = await sharp(inputLogo)
      .resize(Math.round(fgSize * 0.72), Math.round(fgSize * 0.72), { fit: 'contain' })
      .toBuffer();

    await sharp({
      create: {
        width: fgSize,
        height: fgSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite([
      {
        input: fgLogo,
        top: Math.round(fgSize * 0.14),
        left: Math.round(fgSize * 0.14)
      }
    ])
    .png()
    .toFile(path.join(targetFolder, 'ic_launcher_foreground.png'));

    console.log(`✓ Generated ${folder} (${size}x${size}, fg: ${fgSize}x${fgSize})`);
  }

  // 4. Create Splash Screen for Android (drawable/splash.png)
  const splashDir = path.join(resDir, 'drawable');
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }

  const splashWidth = 480;
  const splashHeight = 800;
  const splashLogo = await sharp(inputLogo)
    .resize(260, 260, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: splashWidth,
      height: splashHeight,
      channels: 4,
      background: '#130a05'
    }
  })
  .composite([
    {
      input: splashLogo,
      top: Math.round(splashHeight / 2 - 160),
      left: Math.round(splashWidth / 2 - 130)
    },
    {
      input: Buffer.from(`
        <svg width="${splashWidth}" height="${splashHeight}">
          <text x="${splashWidth / 2}" y="${splashHeight / 2 + 130}" font-family="serif" font-size="28" font-weight="900" fill="#f7ede4" text-anchor="middle" letter-spacing="2">WAFFLE &amp; CAKE</text>
          <text x="${splashWidth / 2}" y="${splashHeight / 2 + 160}" font-family="sans-serif" font-size="12" font-weight="700" fill="#cca043" text-anchor="middle" letter-spacing="3">PANCAKES • DRINKS • DESSERTS</text>
        </svg>
      `),
      top: 0,
      left: 0
    }
  ])
  .png()
  .toFile(path.join(splashDir, 'splash.png'));

  console.log('✓ Created android splash screen drawable/splash.png (480x800)');
  console.log('🎉 All Waffle House Android App Icons generated successfully!');
}

createIcons().catch(console.error);
