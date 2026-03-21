import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ledgr — Your Daily Spending Companion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#FDFBF7",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 20% 80%, rgba(13, 148, 136, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(217, 119, 6, 0.06) 0%, transparent 50%)",
            display: "flex",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
          }}
        >
          {/* Logo - ledger lines icon + wordmark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            {/* Ledger lines icon */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "5px",
                width: "52px",
                height: "52px",
                padding: "8px",
              }}
            >
              <div style={{ height: "5px", width: "100%", backgroundColor: "#0d9488", borderRadius: "99px", display: "flex" }} />
              <div style={{ height: "5px", width: "70%", backgroundColor: "#0d9488", borderRadius: "99px", display: "flex" }} />
              <div style={{ height: "5px", width: "85%", backgroundColor: "#0d9488", borderRadius: "99px", display: "flex" }} />
              <div style={{ height: "5px", width: "50%", backgroundColor: "#292524", borderRadius: "99px", display: "flex" }} />
            </div>
            <span
              style={{
                fontSize: "48px",
                fontWeight: 700,
                color: "#1c1917",
                letterSpacing: "-0.02em",
              }}
            >
              ledgr
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: "28px",
              color: "#0d9488",
              fontWeight: 600,
              margin: 0,
            }}
          >
            Your Daily Spending Companion
          </p>

          {/* Description */}
          <p
            style={{
              fontSize: "20px",
              color: "#78716c",
              maxWidth: "600px",
              textAlign: "center",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Know exactly what you can spend today, every day.
            Calendar-first budgeting built for freedom, not restriction.
          </p>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            fontSize: "18px",
            color: "#a8a29e",
          }}
        >
          ledgr.ink
        </div>
      </div>
    ),
    { ...size }
  );
}
