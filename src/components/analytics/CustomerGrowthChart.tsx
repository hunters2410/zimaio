import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface CustomerGrowthChartProps {
  data: Array<{
    date: string;
    total: number;
    new: number;
  }>;
}

export function CustomerGrowthChart({ data }: CustomerGrowthChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
        <XAxis
          dataKey="date"
          stroke={isDark ? '#9ca3af' : '#6b7280'}
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke={isDark ? '#9ca3af' : '#6b7280'}
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            fontSize: '14px'
          }}
          labelStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#3b82f6"
          fillOpacity={1}
          fill="url(#colorTotal)"
          name="Total Customers"
        />
        <Area
          type="monotone"
          dataKey="new"
          stroke="#10b981"
          fillOpacity={1}
          fill="url(#colorNew)"
          name="New Customers"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
