"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Word = { text: string; x: number; y: number; size: number };

const WORDS = ["DEFAULT", "GARDEN", "ROUTE", "ATTENTION", "ENGINE", "FOCUS", "FLOW", "ACTION", "SEARCH", "MAP", "DATA"];

const hslToRgb = (hsl: string) => {
  const parts = hsl.replace(/[^\d.,]/g, "").split(",");
  const h = parseFloat(parts[0]) || 0;
  const s = (parseFloat(parts[1]) || 0) / 100;
  const l = (parseFloat(parts[2]) || 0) / 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color);
  };
  return { r: f(0), g: f(8), b: f(4) };
};

const buildWords = (width: number, height: number, count = 90): Word[] => {
  const arr: Word[] = [];
  for (let i = 0; i < count; i++) {
    const size = Math.random() * 20 + 8;
    arr.push({
      text: WORDS[i % WORDS.length],
      x: Math.random() * width,
      y: Math.random() * height,
      size,
    });
  }
  return arr;
};

export const ErrorCanvas = ({ code, title, message }: { code: string; title: string; message: string }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId = 0;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    let words = buildWords(width, height, 110);
    let keypress = false;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      words = buildWords(width, height, 110);
    };

    const bgHsl = getComputedStyle(document.documentElement).getPropertyValue("--background").trim() || "0 0% 10%";
    const textHsl = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() || "0 0% 100%";
    const bgRGB = hslToRgb(bgHsl);
    const textRGB = hslToRgb(textHsl);

    const random = (min: number, max: number) => Math.random() * (max - min) + min;
    const rangeMap = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
      ((v - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

    const render = () => {
      if (!ctx) return;
      ctx.fillStyle = `rgb(${bgRGB.r}, ${bgRGB.g}, ${bgRGB.b})`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = `rgba(${textRGB.r}, ${textRGB.g}, ${textRGB.b}, 0.28)`;
      for (let i = 0; i < words.length; i++) {
        ctx.font = `${words[i].size}px sans-serif`;
        ctx.fillText(words[i].text, words[i].x, words[i].y);
        const speed = rangeMap(words[i].size, 8, 28, 1.8, 3.6) * (keypress ? 1.8 : 1);
        words[i].x += speed;
        if (words[i].x > width) {
          words[i].x = -100;
          words[i].y = random(0, height);
        }
      }
      animationId = requestAnimationFrame(render);
    };

    const onKeyDown = () => { keypress = true; };
    const onKeyUp = () => { keypress = false; };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", resize);
    render();
    setReady(true);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#04060c] text-slate-100 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/30 pointer-events-none" />
      <div className="noise-overlay" />

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <div className="glass border border-white/30 bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 text-center space-y-6">
              <div className="text-6xl font-black text-white tracking-tight drop-shadow-lg">{code}</div>
              <div className="text-2xl font-semibold text-sky-200">{title}</div>
              <p className="text-slate-300 leading-relaxed">{message}</p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <Link
                  href="/"
                  className="px-4 py-2 rounded-xl bg-sky-500/30 border border-sky-400/40 text-white font-semibold hover:bg-sky-500/40 transition"
                >
                  Back to Home
                </Link>
                <Link
                  href="/contact"
                  className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-slate-100 font-semibold hover:bg-white/15 transition"
                >
                  Contact Us
                </Link>
              </div>
              {!ready && <p className="text-xs text-slate-500">Loading animation…</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NotFound() {
  return (
    <ErrorCanvas
      code="404"
      title="Page not found"
      message="The page you were looking for isn't here. Try heading back to the map or explore our latest insights."
    />
  );
}

