import { ImageResponse } from "next/og";

// LinkedIn / sosyal önizleme — Cathode Workstation kartı: monitör çerçevesi + fosfor wordmark.
export const runtime = "edge";
export const alt = "Cathode — tarayıcıda çalışan retro işletim sistemi";
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
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0e",
          fontFamily: "monospace",
        }}
      >
        {/* monitör ekranı */}
        <div
          style={{
            width: 1080,
            height: 520,
            borderRadius: 22,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(90% 80% at 50% 45%, #14141a 0%, #050506 80%)",
            border: "1px solid rgba(255,255,255,0.05)",
            boxShadow: "inset 0 0 80px rgba(0,0,0,0.6)",
            position: "relative",
          }}
        >
          {/* grille çizgileri */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 22,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0 5px, rgba(0,0,0,0.35) 5px 7px)",
            }}
          />
          {/* fosfor ışıma */}
          <div
            style={{
              position: "absolute",
              width: 500,
              height: 300,
              borderRadius: 9999,
              background: "rgba(255,176,0,0.12)",
              filter: "blur(80px)",
            }}
          />
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -2,
              color: "#ECE8DE",
              textShadow: "0 0 26px rgba(255,176,0,0.5)",
            }}
          >
            Cathode
          </div>
          <div
            style={{
              marginTop: 16,
              fontSize: 26,
              color: "#FFB000",
              letterSpacing: 6,
            }}
          >
            {"tarayıcıda çalışan retro işletim sistemi"}
          </div>
          <div
            style={{
              marginTop: 30,
              fontSize: 17,
              color: "#6D6A64",
              letterSpacing: 4,
            }}
          >
            {"boot → masaüstü → gerçek emülasyon · sunucu yok"}
          </div>
        </div>
        {/* alt bezel yazısı */}
        <div
          style={{
            position: "absolute",
            bottom: 22,
            right: 80,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 15,
            letterSpacing: 5,
            color: "#55555e",
          }}
        >
          {"cathode 5100"}
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 9999,
              background: "#FFB000",
              boxShadow: "0 0 8px rgba(255,176,0,0.7)",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
