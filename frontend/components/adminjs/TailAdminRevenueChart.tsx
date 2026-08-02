"use client";

import React, { useState } from "react";

type DataPoint = {
  label: string;
  revenue: number;
  sales: number;
};

const WEEKLY_DATA: DataPoint[] = [
  { label: "T2", revenue: 23, sales: 30 },
  { label: "T3", revenue: 42, sales: 25 },
  { label: "T4", revenue: 35, sales: 36 },
  { label: "T5", revenue: 27, sales: 30 },
  { label: "T6", revenue: 51, sales: 45 },
  { label: "T7", revenue: 68, sales: 52 },
  { label: "CN", revenue: 75, sales: 60 },
];

const MONTHLY_DATA: DataPoint[] = [
  { label: "Thg 1", revenue: 165, sales: 120 },
  { label: "Thg 2", revenue: 210, sales: 150 },
  { label: "Thg 3", revenue: 180, sales: 160 },
  { label: "Thg 4", revenue: 290, sales: 210 },
  { label: "Thg 5", revenue: 345, sales: 280 },
  { label: "Thg 6", revenue: 410, sales: 320 },
  { label: "Thg 7", revenue: 380, sales: 290 },
  { label: "Thg 8", revenue: 480, sales: 390 },
  { label: "Thg 9", revenue: 520, sales: 420 },
  { label: "Thg 10", revenue: 590, sales: 460 },
  { label: "Thg 11", revenue: 640, sales: 510 },
  { label: "Thg 12", revenue: 720, sales: 580 },
];

export default function TailAdminRevenueChart() {
  const [timeframe, setTimeframe] = useState<"week" | "month">("month");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const data = timeframe === "week" ? WEEKLY_DATA : MONTHLY_DATA;
  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.sales])) * 1.15;

  const width = 700;
  const height = 260;
  const paddingLeft = 45;
  const paddingBottom = 35;
  const chartWidth = width - paddingLeft;
  const chartHeight = height - paddingBottom;

  const getX = (idx: number) => paddingLeft + (idx / (data.length - 1)) * chartWidth;
  const getY = (val: number) => chartHeight - (val / maxVal) * chartHeight + 10;

  // Bezier path generator
  const createPath = (points: { x: number; y: number }[]) => {
    if (!points.length) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const revenuePoints = data.map((d, i) => ({ x: getX(i), y: getY(d.revenue) }));
  const salesPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.sales) }));

  const revenuePath = createPath(revenuePoints);
  const salesPath = createPath(salesPoints);

  const revenueArea = `${revenuePath} L ${revenuePoints[revenuePoints.length - 1].x} ${chartHeight} L ${revenuePoints[0].x} ${chartHeight} Z`;
  const salesArea = `${salesPath} L ${salesPoints[salesPoints.length - 1].x} ${chartHeight} L ${salesPoints[0].x} ${chartHeight} Z`;

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#2E3A47] rounded-xl p-5 md:p-6 shadow-sm transition-colors">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#1C2434] dark:text-white tracking-tight">
            Tổng Doanh Thu & Doanh Số (Total Revenue)
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#8A99AD] mt-0.5">
            Biểu đồ so sánh doanh thu và số lượng đơn bán ra theo thời gian
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#3C50E0]" />
              <span className="text-[#3C50E0] dark:text-[#80CAEE]">Doanh thu</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#80CAEE]" />
              <span className="text-[#64748B] dark:text-[#8A99AD]">Doanh số</span>
            </div>
          </div>

          {/* Timeframe Switcher */}
          <div className="bg-[#F1F5F9] dark:bg-[#10172A] p-1 rounded-lg flex items-center gap-1 border border-[#E2E8F0] dark:border-[#2E3A47]">
            <button
              onClick={() => setTimeframe("week")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                timeframe === "week"
                  ? "bg-white dark:bg-[#1E293B] text-[#3C50E0] dark:text-white shadow-xs"
                  : "text-[#64748B] dark:text-[#8A99AD] hover:text-[#1C2434]"
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setTimeframe("month")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                timeframe === "month"
                  ? "bg-white dark:bg-[#1E293B] text-[#3C50E0] dark:text-white shadow-xs"
                  : "text-[#64748B] dark:text-[#8A99AD] hover:text-[#1C2434]"
              }`}
            >
              Tháng
            </button>
          </div>
        </div>
      </div>

      {/* SVG Chart Render */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
          <defs>
            <linearGradient id="tailadmin-revenue-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3C50E0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3C50E0" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="tailadmin-sales-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#80CAEE" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#80CAEE" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Horizontal Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight * ratio + 10;
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#E2E8F0"
                  className="dark:stroke-[#2E3A47]"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#94A3B8] dark:fill-[#64748B] text-[10px] font-mono"
                >
                  {val}M
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={revenueArea} fill="url(#tailadmin-revenue-grad)" />
          <path d={salesArea} fill="url(#tailadmin-sales-grad)" />

          {/* Curve Lines */}
          <path d={salesPath} fill="none" stroke="#80CAEE" strokeWidth="2.5" strokeLinecap="round" />
          <path d={revenuePath} fill="none" stroke="#3C50E0" strokeWidth="3" strokeLinecap="round" />

          {/* Data Points & X-Labels */}
          {data.map((d, i) => {
            const x = getX(i);
            const yRev = getY(d.revenue);
            const ySale = getY(d.sales);
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* X Axis Label */}
                <text
                  x={x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-medium transition-colors ${
                    isHovered
                      ? "fill-[#3C50E0] font-bold"
                      : "fill-[#64748B] dark:fill-[#8A99AD]"
                  }`}
                >
                  {d.label}
                </text>

                {/* Vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={10}
                    x2={x}
                    y2={chartHeight}
                    stroke="#3C50E0"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Revenue Circle Dot */}
                <circle
                  cx={x}
                  cy={yRev}
                  r={isHovered ? 6 : 4}
                  className="fill-[#3C50E0] stroke-white dark:stroke-[#1E293B] transition-all"
                  strokeWidth="2"
                />

                {/* Sales Circle Dot */}
                <circle
                  cx={x}
                  cy={ySale}
                  r={isHovered ? 5 : 3.5}
                  className="fill-[#80CAEE] stroke-white dark:stroke-[#1E293B] transition-all"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#1C2434] text-white p-3 rounded-lg shadow-xl border border-[#2E3A47] text-xs space-y-1 pointer-events-none z-20 animate-in fade-in duration-150"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `${getY(data[hoveredIdx].revenue) - 50}px`,
            }}
          >
            <p className="font-bold text-[#80CAEE] border-b border-slate-700 pb-1 mb-1">
              {data[hoveredIdx].label}
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Doanh thu:</span>
              <strong className="text-white font-mono">{data[hoveredIdx].revenue}tr VNĐ</strong>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-300">Doanh số:</span>
              <strong className="text-[#80CAEE] font-mono">{data[hoveredIdx].sales} đơn</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
