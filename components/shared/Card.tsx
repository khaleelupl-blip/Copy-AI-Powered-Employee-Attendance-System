import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, title, actions, className }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 shadow-sm rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 ${className}`}>
      {(title || actions) && (
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
          {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  );
};

export default Card;