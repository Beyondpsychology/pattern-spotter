import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

function loadFont(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "public", "pdf-assets", "fonts", file));
}

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#4a7c6f",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: "Abril", fontSize: 42, color: "#F5F0E8", marginTop: -4 }}>P</div>
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
