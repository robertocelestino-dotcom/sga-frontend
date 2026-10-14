import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`text-center ${compact ? 'py-8' : 'py-16'} px-6`}>
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cdl-navy-50 mb-4">
        <span className="text-4xl" aria-hidden="true">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-cdl-navy-700 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{description}</p>
      )}
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}