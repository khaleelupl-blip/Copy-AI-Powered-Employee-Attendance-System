import React from 'react';

const Spinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 dark:border-sky-400"></div>
    </div>
  );
};

export default Spinner;