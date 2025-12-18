export default function Loading() {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-gray-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-sm">Carregando...</p>
      </div>
    );
  }
  