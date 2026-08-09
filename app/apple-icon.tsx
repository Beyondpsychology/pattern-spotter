import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

function loadFont(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "public", "pdf-assets", "fonts", file));
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#4a7c6f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: "Abril", fontSize: 118, color: "#F5F0E8", marginTop: -10 }}>P</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Abril", data: loadFont("AbrilFatface-Regular.ttf"), style: "normal", weight: 400 },
      ],
    }
  );
}
