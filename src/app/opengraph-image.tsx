import { ImageResponse } from "next/og";

// LinkedIn / sosyal önizleme — özgün, premium obsidyen kart.
export const runtime = "edge";
export const alt = "Cathode — retro işletim sistemi kabuğu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Og() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 120% at 50% 35%, #16161c 0%, #08080a 70%)",
          color: "#E9E6DF",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 150,
            height: 150,
            borderRadius: 9999,
            border: "12px solid #FFB000",
            boxShadow: "0 0 80px rgba(255,176,0,0.45)",
            marginBottom: 44,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 9999,
              background: "#FFB000",
            }}
          />
        </div>
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -2 }}>
          Cathode
        </div>
        <div style={{ fontSize: 30, color: "#8A887F", marginTop: 14 }}>
          tarayıcıda çalışan retro işletim sistemi
        </div>
      </div>
    ),
    size,
  );
}
