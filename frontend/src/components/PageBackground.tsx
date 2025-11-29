import React, { useState, useEffect, type PropsWithChildren } from "react";
import Navbar from "./Navbar";
import s from "./PageBackground.module.css";

type PageBackgroundProps = PropsWithChildren<{
  bg?: string;          // page background color
  showBlobs?: boolean;  // turn blobs on/off
  className?: string;   // extra classes if you need layout tweaks per page
}>;

/**
 * Global layout shell:
 * - fixed Navbar
 * - dark background
 * - two blurred radial blobs with randomized colors (per mount)
 * - main content padded under navbar
 */
export default function PageBackground({
  bg = "#1D283A",
  showBlobs = true,
  className,
  children,
}: PageBackgroundProps) {
  // We'll generate random-ish but nice-looking colors.
  // We'll keep them in state so they don't change every re-render.
  const [blobLeftColor, setBlobLeftColor] = useState<string>("#163660");
  const [blobRightColor, setBlobRightColor] = useState<string>("#4b2fb3");

  useEffect(() => {
    // helper to make a "soft neon glow" color in HSL space
    function randomGlowColor(): string {
      // pick hue between 200-300 (blue/purple range) or 150-210 (teal/blue)
      // you can widen this if you want crazier colors
      const hueBands = [
        [150, 210], // teal / cyan-ish
        [210, 260], // blue / indigo-ish
        [260, 300], // purple / magenta-ish
      ];
      const [minHue, maxHue] =
        hueBands[Math.floor(Math.random() * hueBands.length)];
      const hue =
        minHue + Math.random() * (maxHue - minHue); // pick in that band

      const saturation = 70 + Math.random() * 20; // 70% - 90%
      const lightness = 45 + Math.random() * 15; // 45% - 60%

      // Return hsl() which works as a CSS color token
      return `hsl(${hue.toFixed(0)} ${saturation.toFixed(
        0
      )}% ${lightness.toFixed(0)}%)`;
    }

    setBlobLeftColor(randomGlowColor());
    setBlobRightColor(randomGlowColor());
  }, []);

  return (
    <div
      className={`${s.wrap} flex flex-col items-stretch ${className ?? ""}`}
      style={{
        // page bg
        ["--page-bg" as any]: bg,
        // randomized blob colors
        ["--blob-left-color" as any]: blobLeftColor,
        ["--blob-right-color" as any]: blobRightColor,
      }}
    >
      {/* navbar is globally consistent */}
      <Navbar />

      {/* blobs - conditionally rendered */}
      {showBlobs && <div className={s.blobLeft} />}
      {showBlobs && <div className={s.blobRight} />}

      {/* page body, always pushed below fixed navbar */}
      <main className="pt-16 flex flex-1 flex-col">{children}</main>
    </div>
  );
}
