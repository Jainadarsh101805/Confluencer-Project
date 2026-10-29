import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { VolumeTimelinePoint } from '../../types';

interface VolumeChartProps {
  data: VolumeTimelinePoint[];
}

export const VolumeChart: React.FC<VolumeChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs font-mono text-ledger-dim border border-dashed border-ledger-border rounded-lg">
        NO HISTORICAL VOLUME RECORDED YET
      </div>
    );
  }

  // Parse strings to float numbers for Recharts
  const chartData = data.map((d) => ({
    date: d.date,
    credits: parseFloat(d.credits),
    debits: parseFloat(d.debits),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-ledger-surface2 border border-ledger-border p-3 rounded shadow-lg text-xs font-mono">
          <div className="font-bold text-ledger-text mb-1">{label}</div>
          <div className="text-ledger-lime">
            Credits: ${payload[0]?.value?.toFixed(2)}
          </div>
          <div className="text-ledger-coral">
            Debits: ${payload[1]?.value?.toFixed(2)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2124" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#5A6361"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#242D30' }}
          />
          <YAxis
            stroke="#5A6361"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#242D30' }}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-mono uppercase text-ledger-muted">{value}</span>
            )}
          />
          <Bar dataKey="credits" name="Inflow (Credits)" fill="#C7F36B" radius={[2, 2, 0, 0]} />
          <Bar dataKey="debits" name="Outflow (Debits)" fill="#FF7474" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
