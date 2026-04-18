import { ImageResponse } from "next/og";

export const alt = "CURSOR 48H — AI Hackathon, Tashkent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0c0c12 0%, #151528 45%, #1e1b4b 100%)",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#f8fafc",
            letterSpacing: "-0.02em",
          }}
        >
          CURSOR 48H
        </div>
        <div
          style={{
            fontSize: 34,
            color: "#94a3b8",
            marginTop: 20,
            fontWeight: 500,
          }}
        >
          AI Hackathon · Tashkent
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#64748b",
            marginTop: 28,
          }}
        >
          48 hours · Teams · Mentors
        </div>
      </div>
    ),
    { ...size }
  );
}
