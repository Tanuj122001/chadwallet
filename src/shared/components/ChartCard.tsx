import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { AppText } from './AppText';

export interface ChartCardProps {
  data: number[];
  color: string;
  selectedFilter: '1H' | '24H' | '7D' | '30D';
  onFilterChange: (filter: '1H' | '24H' | '7D' | '30D') => void;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  data,
  color,
  selectedFilter,
  onFilterChange,
  className = '',
}) => {
  if (data.length < 2) return null;
  const width = 320;
  const height = 180;
  const paddingBottom = 15;
  const paddingTop = 15;
  const chartHeight = height - paddingBottom - paddingTop;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - paddingBottom - ((val - min) / range) * chartHeight;
    return { x, y };
  });

  const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaData = `${pathData} L ${width},${height} L 0,${height} Z`;

  return (
    <View className={`mb-space-lg ${className}`}>
      {/* Title & Filters */}
      <View className="flex-row justify-between items-center mb-space-sm">
        <AppText variant="body" weight="bold">
          Market Activity
        </AppText>
        
        {/* Filter buttons */}
        <View className="flex-row gap-x-1.5 bg-surface border border-border rounded-radius-full p-1">
          {(['1H', '24H', '7D', '30D'] as const).map(filter => {
            const isActive = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => onFilterChange(filter)}
                className={`px-3 py-1 rounded-radius-full ${isActive ? 'bg-primary' : 'bg-transparent'}`}
                activeOpacity={0.8}
              >
                <AppText
                  variant="caption"
                  weight="bold"
                  className={isActive ? 'text-background' : 'text-textSecondary'}
                >
                  {filter}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SVG Chart */}
      <View style={{ width: '100%', height }} className="bg-surface border border-border rounded-radius-lg overflow-hidden justify-center items-center">
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <Stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Horizontal reference lines */}
          {[0.25, 0.5, 0.75].map((ratio, index) => {
            const y = paddingTop + ratio * chartHeight;
            return (
              <Line
                key={index}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="#1F262E"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Gradient fill */}
          <Path d={areaData} fill="url(#chartGradient)" />

          {/* Line plot */}
          <Path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Highlight the latest price point */}
          {points.map((p, index) => {
            if (index === points.length - 1) {
              return (
                <React.Fragment key={index}>
                  <Circle cx={p.x} cy={p.y} r={5} fill={color} />
                  <Circle cx={p.x} cy={p.y} r={10} fill={color} opacity={0.3} />
                </React.Fragment>
              );
            }
            return null;
          })}
        </Svg>
      </View>
    </View>
  );
};

export default ChartCard;
