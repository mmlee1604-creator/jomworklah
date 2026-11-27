export const metadata = {
  title: "JomWorkLah | Find your next move",
  description:
    "Explore Malaysian career paths and build a skills roadmap with JomWorkLah's interactive career demo.",
  icons: { icon: "/assets/jomworklah-mark.svg", type: "image/svg+xml" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbf7f1",
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE || (
  process.env.NODE_ENV === "production"
    ? "https://jomworklah.onrender.com/api"
    : "http://localhost:8787/api"
);
const apiBaseLiteral = JSON.stringify(apiBase).replace(/</g, "\\u003c");

export default function RootLayout({ children }) {
  return (
    <html lang="en-MY">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.JKL_API_BASE = ${apiBaseLiteral};`,
          }}
        />
        {/* Same head assets as the static index.html so the demo renders identically. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;1,6..72,300;1,6..72,400&display=swap"
        />
        <script src="https://cdn.tailwindcss.com" defer></script>
        <link rel="stylesheet" href="/styles.css" />
        <link rel="stylesheet" href="/skills-atlas.css" />
        {children}
      </body>
    </html>
  );
}
