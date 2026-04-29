import { ImageResponse } from "next/og";

export const alt = "Third Place investor raise overview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const colors = {
  red: "#D9261F",
  yellow: "#ECEA5F",
  cream: "#EEEDC9",
  creamDeep: "#E7E3BC",
  charcoal: "#2E3432",
  green: "#A9CBB5",
  white: "#FFFFF8",
};

const radii = {
  lg: "1.5rem",
  xl: "2rem",
  pill: "999px",
};

const tileBase = {
  display: "flex",
  flexDirection: "column",
  borderRadius: radii.xl,
  boxShadow: "0 0 0 1px rgba(46, 52, 50, 0.08)",
  overflow: "hidden",
};

const metaPill = (label) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "14px 18px",
      borderRadius: radii.pill,
      background: "rgba(255,255,248,0.76)",
      boxShadow: "0 0 0 1px rgba(46, 52, 50, 0.08)",
      fontSize: "20px",
      color: "rgba(46, 52, 50, 0.86)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "34px",
          background:
            "radial-gradient(circle at top right, rgba(169, 203, 181, 0.45), transparent 28%), linear-gradient(180deg, #EEEDC9 0%, #E7E3BC 100%)",
          color: colors.charcoal,
          fontFamily: "IBM Plex Mono, monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              gap: "18px",
              flex: 1,
            }}
          >
            <div
              style={{
                ...tileBase,
                flex: 1.7,
                justifyContent: "space-between",
                background: colors.white,
                padding: "34px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  
                  gap: "18px",
                }}
              >
                
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignContent: "flex-end",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: "104px",
                      lineHeight: "0.9",
                      fontWeight: 800,
                      letterSpacing: "-0.06em",
                      color: colors.red,
                    }}
                  >
                    Third Place
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: "14px",
                      textTransform: "lowercase",
                      letterSpacing: "0.12em",
                      color: "rgba(46, 52, 50, 0.68)",
                      gap: "12px",
                    }}
                  >
                    by <img src="http://localhost:3000/SVG/lettermark.svg" alt="AG Logo" style={{ width: "108px", height: "28px" }} />
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    maxWidth: "560px",
                    fontSize: "31px",
                    lineHeight: "1.3",
                    letterSpacing: "-0.03em",
                  }}
                >
                  Mobile specialty coffee truck for car culture, community
                  events, and repeatable daily revenue.
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div
                style={{
                  display: "flex",
                  fontSize: "19px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: colors.charcoal,
                  whiteSpace: "nowrap",
                }}
              >
                aluminumgrounds.co/third-place
              </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: "18px",
              }}
            >
              <div
                style={{
                  ...tileBase,
                  flex: 1.15,
                  justifyContent: "space-between",
                  background: colors.red,
                  color: colors.white,
                  padding: "30px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: "18px",
                    color: "rgba(255, 255, 248, 0.76)",
                  }}
                >
                  Raising
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "80px",
                    lineHeight: "0.95",
                    letterSpacing: "-0.05em",
                  }}
                >
                  $20K
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: "22px",
                    lineHeight: "1.35",
                    color: "rgba(255,255,248,0.92)",
                  }}
                >
                  Fast path from secured truck to operating business.
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "18px",
                  flex: 0.85,
                }}
              >
                <div
                  style={{
                    ...tileBase,
                    flex: 1,
                    justifyContent: "space-between",
                    background: colors.green,
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      fontSize: "16px",
                      color: colors.red,
                    }}
                  >
                   FOR
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: "20px",
                      lineHeight: "1.1",
                      letterSpacing: "-0.04em",
                      color: colors.charcoal,
                      textTransform: "uppercase",
                    }}
                  >
                    Events + neighborhood service
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: "100%",
              gap: "18px",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                ...tileBase,
                flex: 1.2,
                justifyContent: "center",
                background: colors.yellow,
                padding: "24px 28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontSize: "18px",
                  color: "rgba(46, 52, 50, 0.72)",
                  marginBottom: "10px",
                }}
              >
                Thesis
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "26px",
                  lineHeight: "1.25",
                  letterSpacing: "-0.03em",
                }}
              >
                Community-first coffee, compact operations, and a quick route to
                real cash flow.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flex: 1.25,
                gap: "12px",
                alignItems: "center",
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              {metaPill("New York City")}
              {metaPill("Events")}
              {metaPill("Neighborhood Service")}
              {metaPill("Investor Round")}
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
