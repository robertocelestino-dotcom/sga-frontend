// src/components/Avatar.tsx
import React from 'react';

interface AvatarProps {
  /** Foto em base64 (data URI) */
  fotoBase64?: string | null;
  /** Fallback — primeira letra do nome */
  nome: string;
  /** Tamanho em pixels */
  size?: number;
  /** Classe CSS adicional */
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  fotoBase64,
  nome,
  size = 32,
  className = ''
}) => {
  const inicial = nome?.charAt(0).toUpperCase() || 'U';

  // 🔥 Se tem foto, mostra a imagem
  if (fotoBase64 && fotoBase64.trim() !== '') {
    return (
      <img
        src={fotoBase64}
        alt={nome}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  // 🔥 Senão, mostra a inicial
  return (
    <div
      className={`rounded-full flex items-center justify-center bg-cdl-navy-700 text-white font-semibold flex-shrink-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.round(size * 0.45)}px`,
      }}
    >
      {inicial}
    </div>
  );
};

export default Avatar;