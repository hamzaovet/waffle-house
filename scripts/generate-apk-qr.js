const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const sharp = require('sharp');

async function main() {
  const url = "https://choco-house.vercel.app/download?auto=1";
  const directApkUrl = "https://github.com/hamzaovet/choco-house/releases/download/v1.0.0/choco-house.apk";
  
  const publicDir = path.join(__dirname, '..', 'public');
  const artifactsDir = 'C:\\Users\\Dr Princa\\.gemini\\antigravity\\brain\\2d9d53fe-6b03-4ac8-8878-725378cea44d';
  
  console.log("Generating high-res QR code for:", url);

  // 1. Generate standalone high-res QR code PNG
  const qrBuffer = await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 600,
    margin: 2,
    color: {
      dark: '#160d05',
      light: '#ffffff',
    }
  });

  const apkQrPath = path.join(publicDir, 'apk-qr.png');
  fs.writeFileSync(apkQrPath, qrBuffer);
  fs.writeFileSync(path.join(artifactsDir, 'apk-qr.png'), qrBuffer);
  console.log("✓ Standalone QR code saved to apk-qr.png");

  // 2. Also generate direct APK download QR
  const directQrBuffer = await QRCode.toBuffer(directApkUrl, {
    errorCorrectionLevel: 'H',
    type: 'png',
    width: 600,
    margin: 2,
    color: {
      dark: '#160d05',
      light: '#ffffff',
    }
  });
  fs.writeFileSync(path.join(publicDir, 'apk-direct-qr.png'), directQrBuffer);
  fs.writeFileSync(path.join(artifactsDir, 'apk-direct-qr.png'), directQrBuffer);
  console.log("✓ Direct download QR saved to apk-direct-qr.png");

  // 3. Create a Luxury Poster Card (900 x 1200)
  const posterWidth = 900;
  const posterHeight = 1250;

  // Read app icon
  const appIconBuffer = await sharp(path.join(publicDir, 'app-icon.png'))
    .resize(130, 130)
    .png()
    .toBuffer();

  // Create composite SVG overlay for typography and luxury styling
  const svgOverlay = `
    <svg width="${posterWidth}" height="${posterHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1c1007"/>
          <stop offset="50%" stop-color="#0f0904"/>
          <stop offset="100%" stop-color="#080402"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#cca043"/>
          <stop offset="50%" stop-color="#f5e1a4"/>
          <stop offset="100%" stop-color="#cca043"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="20" flood-color="#000000" flood-opacity="0.8"/>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="100%" height="100%" fill="url(#bg)"/>

      <!-- Golden Border -->
      <rect x="24" y="24" width="${posterWidth - 48}" height="${posterHeight - 48}" rx="32" 
            fill="none" stroke="url(#gold)" stroke-width="2.5" opacity="0.85"/>
      <rect x="32" y="32" width="${posterWidth - 64}" height="${posterHeight - 64}" rx="26" 
            fill="none" stroke="rgba(204, 160, 67, 0.25)" stroke-width="1"/>

      <!-- Top Badge -->
      <rect x="${posterWidth / 2 - 140}" y="55" width="280" height="38" rx="19" fill="rgba(204, 160, 67, 0.15)" stroke="#cca043" stroke-width="1.2"/>
      <text x="${posterWidth / 2}" y="79" font-family="'Cairo', system-ui, sans-serif" font-size="14" font-weight="900" fill="#cca043" text-anchor="middle" letter-spacing="1">
        ★ النسخة الرسمية للأندرويد v1.0.0 ★
      </text>

      <!-- Title & Subtitle -->
      <text x="${posterWidth / 2}" y="245" font-family="'Cairo', system-ui, sans-serif" font-size="34" font-weight="900" fill="#ffffff" text-anchor="middle">
        تطبيق Choco House Desserts 🍫
      </text>
      <text x="${posterWidth / 2}" y="280" font-family="'Cairo', system-ui, sans-serif" font-size="16" font-weight="600" fill="#c4aa95" text-anchor="middle">
        امسح الكيو آر كود بهاتفك لتحميل وتثبيت التطبيق مباشرة
      </text>

      <!-- QR Card White Background -->
      <rect x="${posterWidth / 2 - 250}" y="320" width="500" height="500" rx="28" fill="#ffffff" filter="url(#shadow)"/>
      <rect x="${posterWidth / 2 - 250}" y="320" width="500" height="500" rx="28" fill="none" stroke="#cca043" stroke-width="3"/>

      <!-- Direct Link Badge -->
      <rect x="${posterWidth / 2 - 280}" y="855" width="560" height="48" rx="24" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(204, 160, 67, 0.4)" stroke-width="1"/>
      <text x="${posterWidth / 2}" y="885" font-family="monospace, system-ui" font-size="14.5" font-weight="700" fill="#cca043" text-anchor="middle">
        choco-house.vercel.app/download
      </text>

      <!-- 3 Steps Section -->
      <g transform="translate(60, 935)">
        <!-- Step 1 -->
        <circle cx="40" cy="30" r="18" fill="#cca043"/>
        <text x="40" y="36" font-family="'Cairo', sans-serif" font-size="14" font-weight="900" fill="#180e06" text-anchor="middle">1</text>
        <text x="75" y="27" font-family="'Cairo', sans-serif" font-size="16" font-weight="800" fill="#ffffff">افتح كاميرا موبايلك</text>
        <text x="75" y="47" font-family="'Cairo', sans-serif" font-size="12" fill="#9c7a5e">وجّه الكاميرا نحو الكيو آر كود</text>

        <!-- Step 2 -->
        <circle cx="310" cy="30" r="18" fill="#cca043"/>
        <text x="310" y="36" font-family="'Cairo', sans-serif" font-size="14" font-weight="900" fill="#180e06" text-anchor="middle">2</text>
        <text x="345" y="27" font-family="'Cairo', sans-serif" font-size="16" font-weight="800" fill="#ffffff">اضغط بدء التنزيل</text>
        <text x="345" y="47" font-family="'Cairo', sans-serif" font-size="12" fill="#9c7a5e">يبدأ تحميل choco-house.apk</text>

        <!-- Step 3 -->
        <circle cx="580" cy="30" r="18" fill="#cca043"/>
        <text x="580" y="36" font-family="'Cairo', sans-serif" font-size="14" font-weight="900" fill="#180e06" text-anchor="middle">3</text>
        <text x="615" y="27" font-family="'Cairo', sans-serif" font-size="16" font-weight="800" fill="#ffffff">تثبيت واستمتع</text>
        <text x="615" y="47" font-family="'Cairo', sans-serif" font-size="12" fill="#9c7a5e">اختر السماح بالتثبيت وابدأ الطلب</text>
      </g>

      <!-- Bottom Footer -->
      <line x1="80" y1="1025" x2="${posterWidth - 80}" y2="1025" stroke="rgba(204, 160, 67, 0.2)" stroke-width="1"/>

      <!-- Feature Pills -->
      <text x="${posterWidth / 2}" y="1065" font-family="'Cairo', system-ui, sans-serif" font-size="13" font-weight="700" fill="#c4aa95" text-anchor="middle">
        🚀 حجم خفيف 8 MB  •  ⚡ سرعة فائقة بدون متصفح  •  🔔 إشعارات لحظية  •  🔒 شات مباشر
      </text>

      <text x="${posterWidth / 2}" y="1195" font-family="'Cairo', sans-serif" font-size="11.5" font-weight="600" fill="#6d5440" text-anchor="middle">
        تم تطوير النظام والتطبيق بواسطة شركة أوركا للحلول البرمجية والخدمات السحابية
      </text>
    </svg>
  `;

  // Resize QR code for embedding in card
  const resizedQr = await sharp(qrBuffer)
    .resize(440, 440)
    .png()
    .toBuffer();

  // Combine background, icon, typography, and QR into final Poster
  const poster = await sharp(Buffer.from(svgOverlay))
    .composite([
      // App Icon at top
      {
        input: appIconBuffer,
        top: 95,
        left: Math.round(posterWidth / 2 - 65),
      },
      // QR Code centered on the white card
      {
        input: resizedQr,
        top: 350,
        left: Math.round(posterWidth / 2 - 220),
      }
    ])
    .png()
    .toBuffer();

  const posterPath = path.join(publicDir, 'choco-apk-poster.png');
  fs.writeFileSync(posterPath, poster);
  fs.writeFileSync(path.join(artifactsDir, 'choco-apk-poster.png'), poster);
  console.log("✓ Luxury Poster Card created at:", posterPath);
}

main().catch(console.error);
