import React from 'react';

interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', rounded = 'md' }) => {
  const r = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' }[rounded];
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-gradient-to-r from-cdl-neutral-100 via-cdl-neutral-50 to-cdl-neutral-100 ${r} ${className}`}
    />
  );
};

/** Skeleton específico para linhas de tabela — mantém altura real p/ não "pular" layout */
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 8,
  cols = 6,
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {Array.from({ length: cols }).map((_, i) => (
            <th key={i} className="px-6 py-3">
              <Skeleton className="h-3 w-24" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} className="px-6 py-4">
                <Skeleton className={`h-4 ${c === 0 ? 'w-24' : c === 1 ? 'w-56' : 'w-32'}`} />
                {c === 1 && <Skeleton className="h-3 w-40 mt-2" />}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Skeleton;