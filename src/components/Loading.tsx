interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({
  message = 'Carregando...',
  fullScreen = false,
}: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full flex flex-col items-center justify-center text-gray-600 ${
        fullScreen ? 'h-screen' : 'h-[60vh]'
      }`}
    >
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-cdl-navy-100 border-t-cdl-navy-700" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-cdl-yellow-500 animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-cdl-navy-700">{message}</p>
    </div>
  );
}