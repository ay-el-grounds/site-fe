import { ImageResponse } from "next/og";

export const alt = "Third Place investor raise overview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #EEEDC9 0%, #E7E3BC 100%)",
          color: "#2E3432",
          fontFamily: "monospace",
          padding: "48px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            borderRadius: "32px",
            background: "rgba(255, 255, 248, 0.72)",
            padding: "44px",
            boxShadow: "0 0 0 1px rgba(46, 52, 50, 0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  display: "flex",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "24px",
                  color: "#D9261F",
                }}
              >
                Friends & Family Round
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "88px",
                  lineHeight: "0.92",
                  color: "#D9261F",
                }}
              >
                Third Place
              </div>
              <div
                style={{
                  display: "flex",
                  maxWidth: "700px",
                  fontSize: "34px",
                  lineHeight: "1.3",
                }}
              >
                Mobile coffee truck for car culture, community events, and
                repeatable daily revenue.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minWidth: "280px",
                minHeight: "220px",
                borderRadius: "28px",
                background: "#D9261F",
                color: "#FFFFF8",
                padding: "28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "20px",
                  color: "rgba(255,255,248,0.76)",
                }}
              >
                Raising now
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "72px",
                  lineHeight: "0.95",
                }}
              >
                $20K
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "24px",
                  lineHeight: "1.35",
                  color: "rgba(255,255,248,0.92)",
                }}
              >
                Fast path from secured truck to operating business.
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "16px",
                fontSize: "24px",
                color: "rgba(46, 52, 50, 0.8)",
              }}
            >
              <div style={{ display: "flex" }}>Brooklyn, NY</div>
              <div style={{ display: "flex" }}>•</div>
              <div style={{ display: "flex" }}>Events</div>
              <div style={{ display: "flex" }}>•</div>
              <div style={{ display: "flex" }}>Neighborhood Service</div>
              <div style={{ display: "flex" }}>•</div>
              <div style={{ display: "flex" }}>Investor Round</div>
            </div>
            <div
              style={{
                display: "flex",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontSize: "22px",
                color: "#2E3432",
              }}
            >
              aluminumgrounds.co/third-place
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
