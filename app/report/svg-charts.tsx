"use client";

import React, { useState, useRef, useEffect } from "react";

// Helper to format currency
function formatCurrency(val: number) {
  return "Rs. " + val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. TREND LINE CHART
// ─────────────────────────────────────────────────────────────────────────────
interface LineChartProps {
  data: { day: number; sales: number; profit: number }[];
}

export function TrendLineChart({ data }: LineChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-[var(--dms-text-muted)]">
        No sales data available for this period.
      </div>
    );
  }

  // Find max value to scale Y-axis
  const maxVal = Math.max(...data.map((d) => Math.max(d.sales, d.profit, 1000)));
  const yMax = Math.ceil(maxVal * 1.15); // Add 15% margin at the top

  const width = 600;
  const height = 250;
  const paddingLeft = 55;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 35;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // X coordinate mapping
  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  // Y coordinate mapping
  const getY = (val: number) => {
    return height - paddingBottom - (val / yMax) * chartHeight;
  };

  // Generate SVG points path for a line
  const getLinePath = (valueKey: "sales" | "profit") => {
    return data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d[valueKey])}`)
      .join(" ");
  };

  // Generate SVG points path for an area under the line
  const getAreaPath = (valueKey: "sales" | "profit") => {
    if (data.length === 0) return "";
    const linePath = getLinePath(valueKey);
    const firstX = getX(0);
    const lastX = getX(data.length - 1);
    const baseY = height - paddingBottom;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // Handle Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert SVG viewbox X to client X ratio
    const svgRatio = width / rect.width;
    const svgX = clientX * svgRatio;

    // Find closest data point
    let closestIdx = 0;
    let minDiff = Infinity;
    data.forEach((_, i) => {
      const diff = Math.abs(getX(i) - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    setHoverIndex(closestIdx);
    
    // Set Tooltip Position in CSS pixels
    const tooltipX = getX(closestIdx) / svgRatio;
    const tooltipY = getY(data[closestIdx].sales) / svgRatio;

    setTooltipPos({
      x: tooltipX + 10,
      y: tooltipY - 60,
    });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Grid lines (Y axis divisions)
  const yTicks = 4;
  const gridLines = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const val = (yMax / yTicks) * i;
    return {
      val,
      y: getY(val),
    };
  });

  // X ticks (days of month)
  const xTicksIndices = data.length > 15 
    ? [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(data.length * 3 / 4), data.length - 1]
    : data.map((_, i) => i);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* SVG Rendering */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Sales Gradient Area */}
          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dms-primary)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--dms-primary)" stopOpacity="0.0" />
          </linearGradient>
          {/* Profit Gradient Area */}
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dms-warning)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--dms-warning)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Grid Lines */}
        {gridLines.map((line, idx) => (
          <g key={idx} className="opacity-40">
            <line
              x1={paddingLeft}
              y1={line.y}
              x2={width - paddingRight}
              y2={line.y}
              stroke="var(--dms-input-border)"
              strokeWidth={1}
              strokeDasharray={idx === 0 ? "none" : "3 3"}
            />
            <text
              x={paddingLeft - 8}
              y={line.y + 4}
              textAnchor="end"
              className="fill-[var(--dms-text-muted)] text-[10px] font-mono"
            >
              {line.val >= 1000 ? `${(line.val / 1000).toFixed(0)}k` : line.val}
            </text>
          </g>
        ))}

        {/* X Axis Labels */}
        {xTicksIndices.map((idx) => {
          const item = data[idx];
          if (!item) return null;
          return (
            <text
              key={idx}
              x={getX(idx)}
              y={height - 12}
              textAnchor="middle"
              className="fill-[var(--dms-text-muted)] text-[10px] font-mono"
            >
              d{item.day}
            </text>
          );
        })}

        {/* Area Charts (Bottom Layer) */}
        <path d={getAreaPath("sales")} fill="url(#salesGrad)" />
        <path d={getAreaPath("profit")} fill="url(#profitGrad)" />

        {/* Line Charts (Middle Layer) */}
        <path
          d={getLinePath("sales")}
          fill="none"
          stroke="var(--dms-primary)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={getLinePath("profit")}
          fill="none"
          stroke="var(--dms-warning)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interaction Elements (Top Layer) */}
        {hoverIndex !== null && data[hoverIndex] && (
          <g>
            {/* Vertical Marker Line */}
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={height - paddingBottom}
              stroke="var(--dms-primary)"
              strokeWidth={1.2}
              strokeDasharray="2 2"
              className="opacity-60"
            />
            
            {/* Sales Indicator Dot */}
            <circle
              cx={getX(hoverIndex)}
              cy={getY(data[hoverIndex].sales)}
              r={4.5}
              fill="var(--dms-bg)"
              stroke="var(--dms-primary)"
              strokeWidth={2}
            />

            {/* Profit Indicator Dot */}
            <circle
              cx={getX(hoverIndex)}
              cy={getY(data[hoverIndex].profit)}
              r={4.5}
              fill="var(--dms-bg)"
              stroke="var(--dms-warning)"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {/* Interactive Floating HTML Tooltip */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute z-10 pointer-events-none rounded-xl border border-[var(--dms-card-border)] bg-[var(--dms-surface-raised)]/95 p-3 shadow-xl backdrop-blur-md transition-all duration-75 ease-out"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">
            Day {data[hoverIndex].day}
          </p>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-4 justify-between">
              <span className="flex items-center gap-1.5 text-xs text-[var(--dms-text-secondary)]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--dms-primary)]" />
                Sales:
              </span>
              <span className="font-mono text-xs font-bold text-[var(--dms-text)]">
                {formatCurrency(data[hoverIndex].sales)}
              </span>
            </div>
            <div className="flex items-center gap-4 justify-between">
              <span className="flex items-center gap-1.5 text-xs text-[var(--dms-text-secondary)]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--dms-warning)]" />
                Profit:
              </span>
              <span className="font-mono text-xs font-bold text-[var(--dms-warning)]">
                {formatCurrency(data[hoverIndex].profit)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. TOP PRODUCTS HORIZONTAL BAR CHART
// ─────────────────────────────────────────────────────────────────────────────
interface BarChartProps {
  data: { name: string; quantity: number }[];
}

export function TopProductsBarChart({ data }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-[var(--dms-text-muted)]">
        No product sales recorded in this period.
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.quantity), 1);

  return (
    <div className="w-full space-y-4 py-1">
      {data.map((item, idx) => {
        const percent = (item.quantity / maxVal) * 100;
        return (
          <div key={idx} className="space-y-1.5">
            {/* Label and Quantity */}
            <div className="flex items-center justify-between text-xs">
              <span className="truncate font-medium text-[var(--dms-text)] pr-4 max-w-[70%]" title={item.name}>
                {item.name}
              </span>
              <span className="shrink-0 font-mono font-bold text-[var(--dms-text-secondary)]">
                {item.quantity.toLocaleString()} pcs
              </span>
            </div>
            
            {/* Horizontal Bar Container */}
            <div className="h-6 w-full rounded-lg bg-[var(--dms-hover-bg)] overflow-hidden">
              {/* Dynamic Bar Fill */}
              <div
                className="h-full rounded-lg bg-gradient-to-r from-[var(--dms-primary)]/80 to-[var(--dms-primary)] transition-all duration-500 ease-out"
                style={{ width: `${Math.max(percent, 2)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// 3. STOCK CATEGORY DONUT CHART
// ─────────────────────────────────────────────────────────────────────────────
interface DonutChartProps {
  data: { category: string; value: number }[];
}

export function CategoryDonutChart({ data }: DonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredData = data.filter((d) => d.value > 0);
  const totalVal = filteredData.reduce((sum, d) => sum + d.value, 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-[var(--dms-text-muted)]">
        No inventory in stock.
      </div>
    );
  }

  // Pre-selected colors matching tailwind/DMS UI
  const colors = [
    "var(--dms-primary)",
    "var(--dms-warning)",
    "#6366f1", // Indigo
    "#06b6d4", // Cyan
    "#ec4899", // Pink
    "#8b5cf6", // Purple
    "#3b82f6", // Blue
    "#f43f5e", // Rose
  ];

  // SVG parameters
  const size = 160;
  const radius = 50;
  const strokeWidth = 14;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius; // ~314.159

  // Calculate coordinates and offsets
  let accumulatedPercent = 0;
  const segments = filteredData.map((d, i) => {
    const percent = d.value / totalVal;
    const strokeDasharray = `${circumference}`;
    const strokeDashoffset = `${circumference * (1 - percent)}`;
    const rotation = accumulatedPercent * 360 - 90; // Start at top (-90deg)
    
    accumulatedPercent += percent;

    return {
      ...d,
      percent,
      strokeDasharray,
      strokeDashoffset,
      rotation,
      color: colors[i % colors.length],
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
      {/* Donut SVG Wrapper */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full overflow-visible">
          {/* Base Background Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--dms-input-border)"
            strokeWidth={strokeWidth}
            className="opacity-20"
          />

          {/* Slices */}
          {segments.map((seg, idx) => {
            const isHovered = activeIndex === idx;
            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                transform={`rotate(${seg.rotation} ${center} ${center})`}
                strokeLinecap="round"
                className="transition-all duration-300 ease-out cursor-pointer"
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center Text displaying Active Segment or Total */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
          {activeIndex !== null ? (
            <>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)] truncate max-w-[80px]">
                {segments[activeIndex].category}
              </span>
              <span className="mt-0.5 text-xs font-bold text-[var(--dms-text)]">
                {((segments[activeIndex].percent) * 100).toFixed(1)}%
              </span>
            </>
          ) : (
            <>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[var(--dms-text-muted)]">
                Total Stock
              </span>
              <span className="mt-0.5 text-xs font-bold text-[var(--dms-primary)] font-mono">
                {totalVal >= 1000000 
                  ? `${(totalVal / 1000000).toFixed(2)}M` 
                  : totalVal >= 1000 
                    ? `${(totalVal / 1000).toFixed(0)}k` 
                    : totalVal}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-2 max-w-[200px]">
        {segments.map((seg, idx) => {
          const isHovered = activeIndex === idx;
          return (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-lg p-1.5 transition-colors duration-150 cursor-pointer ${
                isHovered ? "bg-[var(--dms-hover-bg)]" : ""
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                <span className="truncate text-xs font-medium text-[var(--dms-text-secondary)]">
                  {seg.category}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-semibold text-[var(--dms-text-muted)] pl-3">
                {(seg.percent * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
