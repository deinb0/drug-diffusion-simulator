import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Info, Play, Pause, RefreshCcw } from "lucide-react";

// Drug Diffusion Through Tissue Simulator (Animated)
// Uses Fick's 2nd law in 1D slab (semi-analytical series solution).
// c(x,t) = C0 * (1 - (4/π) * Σ (1/(2n+1)) * exp(-D(2n+1)^2π^2t / 4L^2) * cos((2n+1)πx / 2L))
// for 0 <= x <= L, where L = tissue thickness.

export default function DrugDiffusionSimulator() {
  const [D, setD] = useState(1e-10); // diffusion coefficient (m^2/s)
  const [thickness, setThickness] = useState(200e-6); // tissue thickness (m)
  const [C0, setC0] = useState(1.0); // initial concentration at surface (arbitrary units)
  const [time, setTime] = useState(0); // current time (s)
  const [running, setRunning] = useState(false);

  const maxTime = 3600; // simulate up to 1 hour (s)
  const nTerms = 20; // series expansion terms

  // Calculate concentration profile at given time
  const calcProfile = (t) => {
    const points = 80;
    const arr = [];
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * thickness; // depth in m
      let seriesSum = 0;
      for (let n = 0; n < nTerms; n++) {
        const term = 1 / (2 * n + 1);
        const decay = Math.exp(
          -D * Math.pow((2 * n + 1) * Math.PI / (2 * thickness), 2) * t
        );
        seriesSum += term * decay * Math.cos(((2 * n + 1) * Math.PI * x) / (2 * thickness));
      }
      const c = C0 * (1 - (4 / Math.PI) * seriesSum);
      arr.push({ x: x * 1e6, concentration: c }); // depth in microns
    }
    return arr;
  };

  const data = useMemo(() => calcProfile(time), [time, D, thickness, C0]);

  // Animation loop
  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTime((prev) => {
        if (prev >= maxTime) return 0;
        return prev + 5;
      });
    }, 100);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="min-h-screen p-6 bg-[#0b1020] text-slate-200">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Drug Diffusion Through Tissue</h1>
          <div className="text-sm text-slate-400 flex items-center gap-3">
            <Info className="w-5 h-5 text-slate-400" />
            <span>1D slab · Fick’s 2nd law · Animated</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="col-span-1 bg-[#0f1724] p-4 rounded-2xl shadow-sm border border-slate-800">
            <h2 className="text-lg font-medium mb-3">Controls</h2>

            <label className="block text-sm text-slate-400">Diffusion coefficient D (m²/s)</label>
            <input
              type="range"
              min={1e-12}
              max={1e-9}
              step={1e-12}
              value={D}
              onChange={(e) => setD(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-slate-300 mb-3">{D.toExponential(2)} m²/s</div>

            <label className="block text-sm text-slate-400">Tissue thickness L (µm)</label>
            <input
              type="range"
              min={50}
              max={1000}
              step={10}
              value={Math.round(thickness * 1e6)}
              onChange={(e) => setThickness(Number(e.target.value) * 1e-6)}
              className="w-full"
            />
            <div className="text-xs text-slate-300 mb-3">{Math.round(thickness * 1e6)} µm</div>

            <label className="block text-sm text-slate-400">Surface concentration C₀ (a.u.)</label>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={C0}
              onChange={(e) => setC0(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-slate-300 mb-3">{C0.toFixed(2)} a.u.</div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setRunning((r) => !r)}
                className="px-3 py-2 bg-[#162033] rounded-md text-sm border border-slate-700 hover:opacity-90 flex items-center gap-2"
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {running ? "Pause" : "Play"}
              </button>

              <button
                onClick={() => setTime(0)}
                className="px-3 py-2 bg-[#1b2a3a] rounded-md text-sm border border-slate-700 hover:opacity-90 flex items-center gap-2"
              >
                <RefreshCcw className="w-4 h-4" /> Reset
              </button>
            </div>

            <div className="mt-4 text-xs text-slate-400">
              <div>Current time:</div>
              <div className="font-mono text-sm mt-1">{time} s ({(time/60).toFixed(1)} min)</div>
            </div>
          </div>

          {/* Chart */}
          <div className="col-span-2 bg-[#071122] p-4 rounded-2xl shadow-sm border border-slate-800">
            <h3 className="text-sm text-slate-300 mb-2">Concentration profile vs depth</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 6, right: 12, left: 0, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0f1724" />
                  <XAxis
                    dataKey="x"
                    label={{ value: "Depth (µm)", position: "insideBottomRight", offset: -8 }}
                    stroke="#9aa4b2"
                  />
                  <YAxis
                    domain={[0, C0]}
                    label={{ value: "Concentration (a.u.)", angle: -90, position: "insideLeft" }}
                    stroke="#9aa4b2"
                  />
                  <Tooltip formatter={(v) => v.toFixed(3)} />
                  <Line type="monotone" dataKey="concentration" stroke="#7ee7c7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <footer className="mt-6 text-sm text-slate-400">
          <h4 className="font-medium mb-1">How to Use:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Adjust <b>D</b> to represent how quickly the drug diffuses (higher = faster spread).</li>
            <li>Change <b>L</b> to represent tissue thickness (e.g., skin layer).</li>
            <li>Set <b>C₀</b> as the surface drug concentration (like a patch dosage).</li>
            <li>Press <b>Play</b> to animate diffusion over time. The curve shows drug concentration vs tissue depth.</li>
            <li>Observe that initially drug stays near the surface, then penetrates deeper as time advances.</li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
