import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const LOGO_URL = "https://beyondpsychology.eu/wp-content/uploads/2026/08/Logo-bp-black.png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#F5F0E8",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_URL} width={46} height={46} style={{ objectFit: "contain" }} alt="" />
      </div>
    ),
    { ...size }
  );
}
