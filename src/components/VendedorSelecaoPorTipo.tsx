// src/components/VendedorSelecaoPorTipo.tsx - NOVO
import React, { useEffect, useState } from 'react';
import { vendedorService } from '../services/vendedorService';
import { VendedorResumoDTO } from '../types/vendedor';

interface VendedorSelecaoPorTipoProps {
  tipoId: number;
  tipoNome: string;
  selectedId?: number;
  onSelect: (vendedorId: number, vendedorNome: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const VendedorSelecaoPorTipo: React.FC<VendedorSelecaoPorTipoProps> = ({
  tipoId,
  tipoNome,
  selectedId,
  onSelect,
  disabled = false,
  placeholder = `Selecione ${tipoNome}`,
  className = ''
}) => {
  const [vendedores, setVendedores] = useState<VendedorResumoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    carregarVendedores();
  }, [tipoId]);

  const carregarVendedores = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carrega vendedores ativos do tipo específico
      const data = await vendedorService.buscarAtivosPorTipoParaDropdown(tipoId);
      setVendedores(data);
    } catch (err) {
      setError('Erro ao carregar vendedores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    const vendedor = vendedores.find(v => v.id === id);
    if (vendedor) {
      onSelect(vendedor.id, vendedor.nomeRazao);
    }
  };

  return (
    <div className={`vendedor-selecao ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {tipoNome}
      </label>
      
      {loading ? (
        <div className="text-sm text-gray-500">Carregando...</div>
      ) : error ? (
        <div className="text-sm text-red-500">{error}</div>
      ) : (
        <select
          value={selectedId || ''}
          onChange={handleSelect}
          disabled={disabled || vendedores.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {vendedores.map(vendedor => (
            <option key={vendedor.id} value={vendedor.id}>
              {vendedor.nomeRazao} {vendedor.nomeFantasia ? `(${vendedor.nomeFantasia})` : ''}
            </option>
          ))}
        </select>
      )}
      
      {vendedores.length === 0 && !loading && (
        <div className="text-sm text-gray-500 mt-1">
          Nenhum vendedor disponível
        </div>
      )}
    </div>
  );
};

export default VendedorSelecaoPorTipo;