'use client';

import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { EntityEffortData } from '@/components/charts/source-code/types';

interface TreemapData {
  name: string;
  value: number;
  [key: string]: any; // Add index signature
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: {
    payload: TreemapData;
  }[];
}

interface CustomizedTreemapContentProps {
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  name: string;
  value: number;
  colors: string[];
  maxValue: number;
}

interface EntityEffortTreemapProps {
  data: EntityEffortData[];
}

const COLORS_SCALE = [
  '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1',
];

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px' }}>
        <p className="label">{`Entity: ${data.name}`}</p>
        <p className="intro">{`Total Revisions: ${data.value}`}</p>
      </div>
    );
  }
  return null;
};

const EntityEffortTreemap: React.FC<EntityEffortTreemapProps> = ({ data }) => {
  const formattedData: TreemapData[] = data.map(item => ({
    name: item.entity,
    value: item['total-revs'],
  }));

  const maxValue = Math.max(...formattedData.map(item => item.value));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        data={formattedData}
        dataKey="value"
        aspectRatio={4 / 3}
        stroke="#fff"
        fill="#8884d8"
        content={(props) => <CustomizedTreemapContent {...props} colors={COLORS_SCALE} maxValue={maxValue} />}
      >
        <Tooltip content={<CustomTooltip />} />
      </Treemap>
    </ResponsiveContainer>
  );
};

const CustomizedTreemapContent: React.FC<CustomizedTreemapContentProps> = (props) => {
  const { depth, x, y, width, height, index, name, value, colors, maxValue } = props;

  const colorIndex = Math.min(
    Math.floor((value / maxValue) * colors.length),
    colors.length - 1
  );

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: colors[colorIndex],
          stroke: '#fff',
          strokeWidth: 2 / (depth + 1),
          strokeOpacity: 1,
        }}
      />
      {depth === 1 ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
        >
          {name} ({value})
        </text>
      ) : null}
    </g>
  );
};

export default EntityEffortTreemap;
