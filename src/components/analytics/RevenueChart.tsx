import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
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
        <Legend wrapperStyle={{ fontSize: '14px' }} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#06b6d4"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Revenue ($)"
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
          name="Orders"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
