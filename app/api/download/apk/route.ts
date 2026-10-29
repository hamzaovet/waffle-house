import { NextResponse } from "next/server";

export async function GET() {
  // Direct link to the latest Waffle House APK on GitHub Releases
  const downloadUrl =
    process.env.APK_DOWNLOAD_URL ||
    "https://github.com/hamzaovet/waffle-house/releases/download/v1.0.4/waffle-cake.apk";

  return NextResponse.redirect(downloadUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
