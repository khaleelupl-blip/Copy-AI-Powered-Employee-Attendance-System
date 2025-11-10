import React from 'react';
import type { AttendanceRecord, LeaveRequest } from '../../types';
import Card from '../shared/Card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

interface AnalyticsTabProps {
  attendanceRecords: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
}

const COLORS = ['#0ea5e9', '#14b8a6', '#f59e0b', '#f43f5e'];

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ attendanceRecords, leaveRequests }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tickColor = isDark ? '#94a3b8' : '#6b7280';
  const gridColor = isDark ? '#334155' : '#e5e7eb';


  const attendanceTrendData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const presentUsernames = new Set(
        attendanceRecords
          .filter(r => r.date === date && r.checkInTime)
          .map(r => r.username)
      );
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Present: presentUsernames.size,
      };
    });
  }, [attendanceRecords]);

  const leaveTypeData = React.useMemo(() => {
    const counts = leaveRequests.reduce((acc, req) => {
      acc[req.leaveType] = (acc[req.leaveType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name: t(`${name}_leave`), value }));
  }, [leaveRequests, t]);

  const leaveStatusData = React.useMemo(() => {
    const counts = leaveRequests.reduce((acc, req) => {
      acc[req.status] = (acc[req.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
        { name: t('approved'), count: counts.approved || 0, fill: '#10B981' },
        { name: t('rejected'), count: counts.rejected || 0, fill: '#EF4444' },
        { name: t('pending'), count: counts.pending || 0, fill: '#F59E0B' },
    ]
  }, [leaveRequests, t]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-md border border-gray-200 dark:border-slate-700">
          <p className="label text-sm font-semibold">{`${label}`}</p>
          <p className="intro text-sm text-sky-500">{`${payload[0].name} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title={t('weekly_attendance_trend')}>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fill: tickColor }} fontSize={12} />
              <YAxis allowDecimals={false} tick={{ fill: tickColor }} fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: tickColor }} />
              <Line type="monotone" dataKey="Present" stroke="#0ea5e9" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <div className="space-y-6">
        <Card title={t('leave_requests_by_type')}>
            <div className="h-60">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={leaveTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {leaveTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                     <Tooltip content={<CustomTooltip />} />
                     <Legend wrapperStyle={{ color: tickColor }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
         <Card title={t('leave_requests_by_status')}>
             <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leaveStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: tickColor }} fontSize={12} />
                        <YAxis type="category" dataKey="name" tick={{ fill: tickColor }} fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </Card>
      </div>

    </div>
  );
};

export default AnalyticsTab;