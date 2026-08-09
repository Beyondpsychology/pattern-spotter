import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function loadFont(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "public", "pdf-assets", "fonts", file));
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#4a7c6f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <div
          style={{
            fontFamily: "serif",
            fontStyle: "italic",
            fontSize: 28,
            color: "rgba(255,255,255,0.75)",
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Introducing
        </div>
        <div
          style={{
            fontFamily: "Abril",
            fontSize: 84,
            color: "#F5F0E8",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          The Pattern Spotter
        </div>
        <div
          style={{
            fontFamily: "sans-serif",
            fontSize: 28,
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            marginTop: 28,
            maxWidth: 820,
          }}
        >
          Answer four questions and find out which pattern is still running your life.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Abril", data: loadFont("AbrilFatface-Regular.ttf"), style: "normal", weight: 400 }],
    }
  );
}
