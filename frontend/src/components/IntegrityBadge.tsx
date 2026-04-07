import React from 'react';

interface IntegrityBadgeProps {
  status: 'CLEAN' | 'TAMPERED' | 'UNSIGNED';
  tooltipText?: string;
}

export const IntegrityBadge: React.FC<IntegrityBadgeProps> = ({ status, tooltipText }) => {
  const statusConfig = {
    CLEAN: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      dot: 'bg-green-500',
      label: 'Data Verified',
    },
    TAMPERED: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      dot: 'bg-red-500',
      label: 'Data Tampered',
    },
    UNSIGNED: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      dot: 'bg-yellow-500',
      label: 'Not Signed',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}
      title={tooltipText}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
};
