import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface MiniChartProps {
  data: number[];
  color?: string;
  uptrend?: boolean;
}

export const MiniChart: React.FC<MiniChartProps> = React.memo(({
  data,
  color,
  uptrend = true,
}) => {
  if (!data || data.length < 2) return null;
  const width = 88;
  const height = 42;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  // Leave small padding so line fits within SVG frame
  const padding = 2;
  const chartHeight = height - padding * 2;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - padding - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  // Generate smooth SVG curve using cubic bezier control points
  let pathData = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 3;
    const cp1y = curr.y;
    const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
    const cp2y = next.y;
    pathData += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  const strokeColor = color || (uptrend ? '#22F27C' : '#FF5C5C');

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export default MiniChart;
