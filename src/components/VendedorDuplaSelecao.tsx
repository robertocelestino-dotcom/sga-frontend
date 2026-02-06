// src/components/VendedorDuplaSelecao.tsx - VERSÃO CORRIGIDA
import React, { useState, useEffect } from 'react';
import { vendedorService, VendedorResumoDTO } from '../services/vendedorService';

interface VendedorDuplaSelecaoProps {
  vendedorInternoId?: number;
  vendedorExternoId?: number;
  onVendedorInternoChange: (vendedorId: number | null, vendedorNome: string) => void;
  onVendedorExternoChange: (vendedorId: number | null, vendedorNome: string) => void;
  disabled?: boolean;
}

const VendedorDuplaSelecao: React.FC<VendedorDuplaSelecaoProps> = ({
  vendedorInternoId,
  vendedorExternoId,
  onVendedorInternoChange,
  onVendedorExternoChange,
  disabled = false
}) => {
  const [vendedoresInternos, setVendedoresInternos] = useState<VendedorResumoDTO[]>([]);
  const [vendedoresExternos, setVendedoresExternos] = useState<VendedorResumoDTO[]>([]);
  const [loadingInternos, setLoadingInternos] = useState(false);
  const [loadingExternos, setLoadingExternos] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 🔴 FUNÇÃO CORRIGIDA: Carregar vendedores internos (tipo 1)
  const carregarVendedoresInternos = async () => {
    if (loadingInternos) return;
    
    try {
      setLoadingInternos(true);
      console.log('📥 Carregando vendedores internos (tipo 1)...');
      
      const vendedores = await vendedorService.buscarVendedoresTipo1Ativos();
      console.log(`✅ ${vendedores.length} vendedores internos carregados`);
      
      setVendedoresInternos(vendedores);
      
      // Log para debug
      if (vendedores.length === 0) {
        console.warn('⚠️ Nenhum vendedor interno encontrado (tipo 1)');
      } else {
        console.log('📋 Vendedores internos (primeiros 5):', 
          vendedores.slice(0, 5).map(v => ({ id: v.id, nome: v.nomeRazao, tipo: v.vendedorTipoDescricao }))
        );
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vendedores internos:', error);
      setError('Erro ao carregar vendedores internos');
      setVendedoresInternos([]);
    } finally {
      setLoadingInternos(false);
    }
  };
  
  // 🔴 FUNÇÃO CORRIGIDA: Carregar vendedores externos (tipo 2)
  const carregarVendedoresExternos = async () => {
    if (loadingExternos) return;
    
    try {
      setLoadingExternos(true);
      console.log('📥 Carregando vendedores externos (tipo 2)...');
      
      const vendedores = await vendedorService.buscarVendedoresTipo2Ativos();
      console.log(`✅ ${vendedores.length} vendedores externos carregados`);
      
      setVendedoresExternos(vendedores);
      
      // Log para debug
      if (vendedores.length === 0) {
        console.warn('⚠️ Nenhum vendedor externo encontrado (tipo 2)');
      } else {
        console.log('📋 Vendedores externos (primeiros 5):', 
          vendedores.slice(0, 5).map(v => ({ id: v.id, nome: v.nomeRazao, tipo: v.vendedorTipoDescricao }))
        );
      }
    } catch (error) {
      console.error('❌ Erro ao carregar vendedores externos:', error);
      setError('Erro ao carregar vendedores externos');
      setVendedoresExternos([]);
    } finally {
      setLoadingExternos(false);
    }
  };
  
  // Carregar ambos os tipos de vendedores
  useEffect(() => {
    const carregarVendedores = async () => {
      console.log('🚀 Iniciando carregamento de vendedores...');
      await Promise.all([
        carregarVendedoresInternos(),
        carregarVendedoresExternos()
      ]);
    };
    
    carregarVendedores();
  }, []);
  
  // Handler para seleção de vendedor interno
  const handleVendedorInternoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (!value || value === '') {
      onVendedorInternoChange(null, '');
      return;
    }
    
    const vendedorId = parseInt(value);
    const vendedorSelecionado = vendedoresInternos.find(v => v.id === vendedorId);
    
    onVendedorInternoChange(
      vendedorId,
      vendedorSelecionado ? vendedorSelecionado.nomeRazao : ''
    );
  };
  
  // Handler para seleção de vendedor externo
  const handleVendedorExternoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    
    if (!value || value === '') {
      onVendedorExternoChange(null, '');
      return;
    }
    
    const vendedorId = parseInt(value);
    const vendedorSelecionado = vendedoresExternos.find(v => v.id === vendedorId);
    
    onVendedorExternoChange(
      vendedorId,
      vendedorSelecionado ? vendedorSelecionado.nomeRazao : ''
    );
  };
  
  // Limpar seleção de vendedor interno
  const handleLimparInterno = () => {
    onVendedorInternoChange(null, '');
  };
  
  // Limpar seleção de vendedor externo
  const handleLimparExterno = () => {
    onVendedorExternoChange(null, '');
  };
  
  // Obter nome do vendedor selecionado
  const getNomeVendedorInterno = () => {
    if (!vendedorInternoId) return '';
    const vendedor = vendedoresInternos.find(v => v.id === vendedorInternoId);
    return vendedor ? vendedor.nomeRazao : '';
  };
  
  const getNomeVendedorExterno = () => {
    if (!vendedorExternoId) return '';
    const vendedor = vendedoresExternos.find(v => v.id === vendedorExternoId);
    return vendedor ? vendedor.nomeRazao : '';
  };
  
  // Resumo das seleções
  const selecoesAtivas = [
    vendedorInternoId && `Interno: ${getNomeVendedorInterno()}`,
    vendedorExternoId && `Externo: ${getNomeVendedorExterno()}`
  ].filter(Boolean);
  
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      {/* Cards com os combos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Vendedor Interno */}
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">
              <span className="text-blue-600">🏢</span>
              Vendedor Interno
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Tipo 1
              </span>
            </h3>
            {vendedorInternoId && (
              <button
                type="button"
                onClick={handleLimparInterno}
                disabled={disabled}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Selecione o vendedor interno
            </label>
            
            <div className="relative">
              <select
                value={vendedorInternoId || ''}
                onChange={handleVendedorInternoSelect}
                disabled={disabled || loadingInternos}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  disabled || loadingInternos 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Selecione um vendedor interno...</option>
                
                {loadingInternos ? (
                  <option value="" disabled>Carregando vendedores internos...</option>
                ) : vendedoresInternos.length === 0 ? (
                  <option value="" disabled>⚠️ Nenhum vendedor interno encontrado</option>
                ) : (
                  vendedoresInternos.map(vendedor => (
                    <option key={vendedor.id} value={vendedor.id}>
                      {vendedor.nomeRazao}
                      {vendedor.nomeFantasia && ` (${vendedor.nomeFantasia})`}
                      {vendedor.vendedorTipoDescricao && ` - ${vendedor.vendedorTipoDescricao}`}
                    </option>
                  ))
                )}
              </select>
              
              {loadingInternos && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            
            {/* Informações do vendedor interno selecionado */}
            {vendedorInternoId && (
              <div className="p-3 bg-blue-100 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600">👤</div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {getNomeVendedorInterno()}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      ID: {vendedorInternoId} • Vendedor Interno
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Estatísticas */}
            <div className="flex justify-between items-center text-xs text-blue-600">
              <span>
                {loadingInternos ? (
                  'Carregando...'
                ) : vendedoresInternos.length === 0 ? (
                  'Nenhum vendedor interno cadastrado'
                ) : (
                  `${vendedoresInternos.length} vendedor(es) interno(s) disponível(is)`
                )}
              </span>
              <button
                type="button"
                onClick={carregarVendedoresInternos}
                disabled={loadingInternos || disabled}
                className="hover:text-blue-800 hover:underline"
              >
                {loadingInternos ? '🔄' : '↻'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Card Vendedor Externo */}
        <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
              <span className="text-green-600">🌐</span>
              Vendedor Externo
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Tipo 2
              </span>
            </h3>
            {vendedorExternoId && (
              <button
                type="button"
                onClick={handleLimparExterno}
                disabled={disabled}
                className="text-xs text-green-600 hover:text-green-800 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-green-700 mb-1">
              Selecione o vendedor externo
            </label>
            
            <div className="relative">
              <select
                value={vendedorExternoId || ''}
                onChange={handleVendedorExternoSelect}
                disabled={disabled || loadingExternos}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  disabled || loadingExternos 
                    ? 'bg-gray-100 cursor-not-allowed' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Selecione um vendedor externo...</option>
                
                {loadingExternos ? (
                  <option value="" disabled>Carregando vendedores externos...</option>
                ) : vendedoresExternos.length === 0 ? (
                  <option value="" disabled>⚠️ Nenhum vendedor externo encontrado</option>
                ) : (
                  vendedoresExternos.map(vendedor => (
                    <option key={vendedor.id} value={vendedor.id}>
                      {vendedor.nomeRazao}
                      {vendedor.nomeFantasia && ` (${vendedor.nomeFantasia})`}
                      {vendedor.vendedorTipoDescricao && ` - ${vendedor.vendedorTipoDescricao}`}
                    </option>
                  ))
                )}
              </select>
              
              {loadingExternos && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                </div>
              )}
            </div>
            
            {/* Informações do vendedor externo selecionado */}
            {vendedorExternoId && (
              <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-green-600">👤</div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {getNomeVendedorExterno()}
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      ID: {vendedorExternoId} • Vendedor Externo
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Estatísticas */}
            <div className="flex justify-between items-center text-xs text-green-600">
              <span>
                {loadingExternos ? (
                  'Carregando...'
                ) : vendedoresExternos.length === 0 ? (
                  'Nenhum vendedor externo cadastrado'
                ) : (
                  `${vendedoresExternos.length} vendedor(es) externo(s) disponível(is)`
                )}
              </span>
              <button
                type="button"
                onClick={carregarVendedoresExternos}
                disabled={loadingExternos || disabled}
                className="hover:text-green-800 hover:underline"
              >
                {loadingExternos ? '🔄' : '↻'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resumo das seleções 
      {selecoesAtivas.length > 0 && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Vendedores Selecionados:</h4>
          <div className="flex flex-wrap gap-2">
            {selecoesAtivas.map((selecao, index) => (
              <span 
                key={index} 
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selecao?.includes('Interno') 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {selecao}
              </span>
            ))}
          </div>
        </div>
      )}
      */}
      
      {/* Botão para recarregar todos os vendedores 
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            carregarVendedoresInternos();
            carregarVendedoresExternos();
          }}
          disabled={loadingInternos || loadingExternos || disabled}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
        >
          {(loadingInternos || loadingExternos) ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
              Carregando...
            </>
          ) : (
            '🔄 Atualizar Lista de Vendedores'
          )}
        </button>
      </div>
      */}
    </div>
  );
};

export default VendedorDuplaSelecao;