import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'sky' | 'teal' | 'rose' | 'amber' | 'violet';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
    const colorClasses = {
        sky: 'from-sky-500 to-sky-600',
        teal: 'from-teal-500 to-teal-600',
        rose: 'from-rose-500 to-rose-600',
        amber: 'from-amber-500 to-amber-600',
        violet: 'from-violet-500 to-violet-600',
    };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} text-white p-6 rounded-xl shadow-lg`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider opacity-80">{title}</p>
          <p className="text-4xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-50">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;