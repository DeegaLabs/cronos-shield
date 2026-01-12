/**
 * Skeleton Loader Component
 * 
 * Provides loading placeholders for better UX
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  lines = 1 
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-700 rounded';
  
  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-6',
    circular: 'rounded-full',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={className}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses[variant]} mb-2`}
            style={{
              width: i === lines - 1 ? '80%' : '100%',
              height: height || undefined,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width: width || undefined,
        height: height || undefined,
      }}
    />
  );
}

/**
 * Card Skeleton - for metric cards
 */
export function CardSkeleton() {
  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
      <Skeleton variant="text" width="40%" className="mb-4" />
      <Skeleton variant="rectangular" height="48px" className="mb-2" />
      <Skeleton variant="text" width="60%" />
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 3 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  );
}

/**
 * List Item Skeleton
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-slate-700">
      <Skeleton variant="circular" width="40px" height="40px" />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" className="mb-2" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
  );
}
