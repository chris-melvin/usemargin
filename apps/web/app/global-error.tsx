"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily:
              "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
            backgroundColor: "#fafaf9",
            color: "#1c1917",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#78716c",
              marginBottom: "1.5rem",
              maxWidth: "28rem",
            }}
          >
            An unexpected error occurred. Please try again or contact support if
            the problem persists.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1.25rem",
              backgroundColor: "#0d9488",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
