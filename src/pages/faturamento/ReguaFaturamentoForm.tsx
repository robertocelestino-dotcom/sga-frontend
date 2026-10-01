// src/pages/faturamento/ReguaFaturamentoForm.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reguaFaturamentoService, ReguaFaturamento, TipoArquivoRegua } from '../../services/reguaFaturamentoService';
import { associadoService, AssociadoResumoDTO } from '../../services/associadoService';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useMessage } from '../../providers/MessageProvider';
import api from '../../services/api';

const periodos = [
  { value: 'PRIMEIRO', label: 'Primeiro Período (Dias 1-2)' },
  { value: 'SEGUNDO', label: 'Segundo Período (Dia 16)' },
  { value: 'TERCEIRO', label: 'Terceiro Período (Dia 26)' }
];

const cores = [
  { value: 'blue', label: 'Azul', class: 'bg-blue-100 text-blue-800' },
  { value: 'green', label: 'Verde', class: 'bg-green-100 text-green-800' },
  { value: 'purple', label: 'Roxo', class: 'bg-purple-100 text-purple-800' },
  { value: 'orange', label: 'Laranja', class: 'bg-orange-100 text-orange-800' },
  { value: 'red', label: 'Vermelho', class: 'bg-red-100 text-red-800' },
  { value: 'indigo', label: 'Índigo', class: 'bg-indigo-100 text-indigo-800' }
];

const icones = [
  { value: '📅', label: 'Calendário' },
  { value: '📊', label: 'Gráfico' },
  { value: '💰', label: 'Dinheiro' },
  { value: '🏦', label: 'Banco' },
  { value: '📈', label: 'Crescimento' },
  { value: '⚡', label: 'Rápido' }
];

const tiposProcessamento = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'EXTEMPORANEO', label: 'Extemporâneo' },
  { value: 'AMBOS', label: 'Ambos' }
];

// Interface para o DTO de associado da régua
interface AssociadoReguaDTO {
  associadoId: number;
  codigoSpc?: string;
  nomeRazao: string;
  nomeFantasia?: string;
  cnpjCpf?: string;
  status: string;
  dataInicio?: string;
}

// ============================================================
// MODAL PARA GERENCIAR TIPOS DE ARQUIVO
// ============================================================

const ModalTiposArquivo: React.FC<{
  aberto: boolean;
  onFechar: () => void;
  tiposExistentes: TipoArquivoRegua[];
  onSalvar: (tipos: TipoArquivoRegua[]) => void;
}> = ({ aberto, onFechar, tiposExistentes, onSalvar }) => {
  const [tipos, setTipos] = useState<TipoArquivoRegua[]>([]);
  const [novoTipo, setNovoTipo] = useState({ tipo: 'CONSOLIDACAO', ordem: 1 });

  useEffect(() => {
    if (aberto) {
      setTipos([...tiposExistentes]);
    }
  }, [aberto, tiposExistentes]);

  const adicionarTipo = () => {
    if (!novoTipo.tipo) return;
    const novoId = Math.max(...tipos.map(t => t.id || 0), 0) + 1;
    setTipos([...tipos, { id: novoId, tipo: novoTipo.tipo, ordem: novoTipo.ordem }]);
    setNovoTipo({ tipo: 'CONSOLIDACAO', ordem: tipos.length + 1 });
  };

  const removerTipo = (index: number) => {
    const novosTipos = tipos.filter((_, i) => i !== index);
    novosTipos.forEach((t, i) => t.ordem = i + 1);
    setTipos(novosTipos);
  };

  const alterarOrdem = (index: number, direcao: 'up' | 'down') => {
    if (direcao === 'up' && index > 0) {
      const novosTipos = [...tipos];
      [novosTipos[index - 1], novosTipos[index]] = [novosTipos[index], novosTipos[index - 1]];
      novosTipos.forEach((t, i) => t.ordem = i + 1);
      setTipos(novosTipos);
    } else if (direcao === 'down' && index < tipos.length - 1) {
      const novosTipos = [...tipos];
      [novosTipos[index], novosTipos[index + 1]] = [novosTipos[index + 1], novosTipos[index]];
      novosTipos.forEach((t, i) => t.ordem = i + 1);
      setTipos(novosTipos);
    }
  };

  const handleSalvar = () => {
    onSalvar(tipos);
    onFechar();
  };

  const getTipoLabel = (tipo: string) => {
    const tiposMap: Record<string, string> = {
      'CONSOLIDACAO': 'Consolidação',
      'PREVIA_CORRENTE': 'Prévia Corrente',
      'PREVIA_ANTERIOR': 'Prévia Anterior'
    };
    return tiposMap[tipo] || tipo;
  };

  return (
    <Modal title="Configurar Tipos de Arquivo" onClose={onFechar} size="lg">
      <div className="space-y-4">
        <div className="flex gap-3">
          <select
            value={novoTipo.tipo}
            onChange={(e) => setNovoTipo({ ...novoTipo, tipo: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="CONSOLIDACAO">Consolidação</option>
            <option value="PREVIA_CORRENTE">Prévia Corrente</option>
            <option value="PREVIA_ANTERIOR">Prévia Anterior</option>
          </select>
          <button
            onClick={adicionarTipo}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tipo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ordem</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tipos.map((tipo, idx) => (
                <tr key={tipo.id}>
                  <td className="px-4 py-2">{getTipoLabel(tipo.tipo)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{tipo.ordem}º</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => alterarOrdem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => alterarOrdem(idx, 'down')}
                          disabled={idx === tipos.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removerTipo(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tipos.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Nenhum tipo de arquivo configurado. Clique em "Adicionar" para começar.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button onClick={onFechar} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleSalvar} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// LISTA DE ASSOCIADOS DA RÉGUA (SOMENTE LEITURA COM SCROLL)
// ============================================================

const ListaAssociadosRegua: React.FC<{
  reguaId: number;
  associados: AssociadoReguaDTO[];
  loading: boolean;
}> = ({ reguaId, associados, loading }) => {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina] = useState(15);
  const [filtroPesquisa, setFiltroPesquisa] = useState('');

  const getCodigoSpc = (assoc: AssociadoReguaDTO): string => {
    if (assoc.codigoSpc) return assoc.codigoSpc;
    if ((assoc as any).associadoCodigoSpc) return (assoc as any).associadoCodigoSpc;
    if ((assoc as any).codigoSocio) return (assoc as any).codigoSocio;
    return '-';
  };

  const getNomeRazao = (assoc: AssociadoReguaDTO): string => {
    if (assoc.nomeRazao) return assoc.nomeRazao;
    if ((assoc as any).associadoNome) return (assoc as any).associadoNome;
    if ((assoc as any).nome) return (assoc as any).nome;
    return '-';
  };

  const associadosFiltrados = associados.filter(assoc => {
    if (!filtroPesquisa) return true;
    const pesquisaLower = filtroPesquisa.toLowerCase();
    const codigoSpc = getCodigoSpc(assoc).toLowerCase();
    const nome = getNomeRazao(assoc).toLowerCase();
    return codigoSpc.includes(pesquisaLower) || nome.includes(pesquisaLower);
  });

  const totalPaginas = Math.ceil(associadosFiltrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const associadosPaginados = associadosFiltrados.slice(inicio, fim);

  const limparFiltro = () => {
    setFiltroPesquisa('');
    setPaginaAtual(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loading size="small" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 🔍 Filtro de pesquisa */}
      <div className="relative">
        <input
          type="text"
          placeholder="🔍 Buscar por Código SPC ou Nome..."
          value={filtroPesquisa}
          onChange={(e) => {
            setFiltroPesquisa(e.target.value);
            setPaginaAtual(1);
          }}
          className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {filtroPesquisa && (
          <button
            onClick={limparFiltro}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* 📊 Contador */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {filtroPesquisa
            ? `${associadosFiltrados.length} de ${associados.length} encontrados`
            : `Total: ${associados.length} associado(s)`}
        </span>
        {associadosFiltrados.length > 0 && (
          <span>
            Mostrando {inicio + 1}-{Math.min(fim, associadosFiltrados.length)}
          </span>
        )}
      </div>

      {associadosFiltrados.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-sm">
            {filtroPesquisa
              ? `Nenhum associado encontrado com "${filtroPesquisa}"`
              : 'Nenhum associado vinculado a esta régua'}
          </p>
        </div>
      ) : (
        <>
          {/* 🔥 LISTA COM SCROLL VERTICAL */}
          <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código SPC
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome/Razão Social
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {associadosPaginados.map((assoc) => (
                  <tr
                    key={assoc.associadoId}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-mono text-xs font-medium text-blue-600">
                        {getCodigoSpc(assoc)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div
                        className="text-sm text-gray-800 truncate max-w-[200px]"
                        title={getNomeRazao(assoc)}
                      >
                        {getNomeRazao(assoc)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 📄 Paginação */}
          {totalPaginas > 1 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 gap-1">
              {/* Primeiro */}
              <button
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtual === 1}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                title="Primeira página"
              >
                ⏮️
              </button>
              
              {/* Anterior */}
              <button
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                title="Página anterior"
              >
                ◀
              </button>
              
              {/* Indicador */}
              <span className="text-xs text-gray-600 whitespace-nowrap px-1">
                {paginaAtual} / {totalPaginas}
              </span>
              
              {/* Próxima */}
              <button
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                title="Próxima página"
              >
                ▶
              </button>
              
              {/* Último */}
              <button
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtual === totalPaginas}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                title="Última página"
              >
                ⏭️
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================
// MODAL PARA SELECIONAR ASSOCIADOS
// ============================================================

const ModalSelecionarAssociados: React.FC<{
  aberto: boolean;
  onFechar: () => void;
  associadosJaVinculados: number[];
  diaEmissaoRegua: number;
  onConfirmar: (ids: number[], dataInicio: string) => void;
}> = ({ aberto, onFechar, associadosJaVinculados, diaEmissaoRegua, onConfirmar }) => {
  const [associadosDisponiveis, setAssociadosDisponiveis] = useState<AssociadoResumoDTO[]>([]);
  const [associadosSelecionados, setAssociadosSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (aberto) {
      carregarAssociados();
      setAssociadosSelecionados([]);
      setFiltro('');
      setError(null);
    }
  }, [aberto]);

  const carregarAssociados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await associadoService.listar({ 
        page: 0, 
        size: 1000, 
        sort: 'nomeRazao', 
        direction: 'asc' 
      });
      
      let associados = [];
      if (response && response.content && Array.isArray(response.content)) {
        associados = response.content;
      } else if (response && Array.isArray(response)) {
        associados = response;
      } else {
        associados = [];
      }
      
      const associadosAtivos = associados.filter(assoc => assoc.status === 'A');
      setAssociadosDisponiveis(associadosAtivos);
      
    } catch (error: any) {
      console.error('Erro ao carregar associados:', error);
      setError(error.message || 'Erro ao carregar associados');
    } finally {
      setLoading(false);
    }
  };

  const associadosFiltrados = associadosDisponiveis.filter(assoc => {
    const jaVinculado = associadosJaVinculados.includes(assoc.id);
    if (jaVinculado) return false;
    
    if (!filtro) return true;
    
    const filtroLower = filtro.toLowerCase();
    
    return (
      (assoc.nomeRazao && assoc.nomeRazao.toLowerCase().includes(filtroLower)) ||
      (assoc.nomeFantasia && assoc.nomeFantasia.toLowerCase().includes(filtroLower)) ||
      (assoc.codigoSpc && assoc.codigoSpc.toLowerCase().includes(filtroLower)) ||
      (assoc.cnpjCpf && assoc.cnpjCpf.includes(filtro))
    );
  });

  const toggleSelecionarTodos = () => {
    const disponiveisIds = associadosFiltrados.map(a => a.id);
    
    if (associadosSelecionados.length === disponiveisIds.length && disponiveisIds.length > 0) {
      setAssociadosSelecionados([]);
    } else {
      setAssociadosSelecionados(disponiveisIds);
    }
  };

  const toggleAssociado = (id: number) => {
    if (associadosSelecionados.includes(id)) {
      setAssociadosSelecionados(associadosSelecionados.filter(i => i !== id));
    } else {
      setAssociadosSelecionados([...associadosSelecionados, id]);
    }
  };

  const handleConfirmar = () => {
    if (associadosSelecionados.length === 0) return;
    onConfirmar(associadosSelecionados, dataInicio);
    onFechar();
  };

  const handleFechar = () => {
    setAssociadosSelecionados([]);
    setFiltro('');
    onFechar();
  };

  const limparFiltro = () => {
    setFiltro('');
  };

  const totalSelecionados = associadosSelecionados.length;
  const totalDisponiveis = associadosFiltrados.length;

  return (
    <Modal title="Selecionar Associados" onClose={handleFechar} size="xl">
      <div className="space-y-4">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">ℹ️</span>
            <span className="text-sm text-blue-800">
              Régua para faturamento no dia {diaEmissaoRegua}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <label className="text-sm font-medium text-gray-700">Data de início na régua:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-xs text-gray-500">Os associados serão ativos a partir desta data</span>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 Pesquisar por nome, código SPC ou CNPJ/CPF..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {filtro && (
              <button
                type="button"
                onClick={limparFiltro}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSelecionarTodos}
            disabled={totalDisponiveis === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {totalSelecionados === totalDisponiveis && totalDisponiveis > 0 ? 'Desmarcar Todos' : 'Marcar Todos'}
          </button>
        </div>

        {filtro && (
          <div className="text-sm text-gray-500">
            Encontrados {associadosFiltrados.length} resultado(s) para "{filtro}"
          </div>
        )}

        <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando associados...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              <p>Erro ao carregar associados: {error}</p>
              <button
                onClick={carregarAssociados}
                className="mt-2 text-blue-600 hover:text-blue-800"
              >
                Tentar novamente
              </button>
            </div>
          ) : associadosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {associadosDisponiveis.length === 0 ? (
                <>
                  <p className="mb-2">Nenhum associado ativo cadastrado no sistema.</p>
                  <button
                    type="button"
                    onClick={() => window.location.href = '/associados/novo'}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clique aqui para cadastrar um associado
                  </button>
                </>
              ) : filtro ? (
                <p>Nenhum associado encontrado com o filtro "{filtro}"</p>
              ) : (
                <p>Todos os associados já estão vinculados a esta régua.</p>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={totalSelecionados === associadosFiltrados.length && associadosFiltrados.length > 0}
                      onChange={toggleSelecionarTodos}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Código SPC</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome/Razão Social</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CNPJ/CPF</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {associadosFiltrados.map((assoc) => (
                  <tr key={assoc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleAssociado(assoc.id)}>
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={associadosSelecionados.includes(assoc.id)}
                        onChange={() => toggleAssociado(assoc.id)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-sm">{assoc.codigoSpc || '-'}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{assoc.nomeRazao}</div>
                      {assoc.nomeFantasia && <div className="text-xs text-gray-500">{assoc.nomeFantasia}</div>}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono">{assoc.cnpjCpf || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        assoc.status === 'A' ? 'bg-green-100 text-green-800' :
                        assoc.status === 'I' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assoc.status === 'A' ? 'Ativo' : assoc.status === 'I' ? 'Inativo' : 'Suspenso'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {totalDisponiveis > 0 ? (
              <>
                <span className="font-medium">{associadosFiltrados.length}</span> associado(s) disponível(is) | 
                <span className="font-medium ml-1">{totalSelecionados}</span> selecionado(s)
              </>
            ) : (
              <span className="text-amber-600">⚠️ Nenhum associado disponível para adicionar</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFechar}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={associadosSelecionados.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Adicionar {associadosSelecionados.length} Associado(s)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

const ReguaFaturamentoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useMessage();
  const isEditMode = !!id;
  
  const [loading, setLoading] = useState(false);
  const [loadingAssociados, setLoadingAssociados] = useState(false);
  const [reguasDisponiveis, setReguasDisponiveis] = useState<ReguaFaturamento[]>([]);
  
  const [formData, setFormData] = useState<ReguaFaturamento>({
    nome: '',
    descricao: '',
    diaEmissao: 1,
    diaVencimento: 10,
    periodo: 'TERCEIRO',
    sequencia: 3,
    tipoArquivo: 'CONSOLIDACAO',
    ordemImportacao: 1,
    ehPadrao: false,
    ativo: true,
    cor: 'blue',
    icone: '📅',
    permiteMigracao: true,
    reguaDestinoMigracaoId: undefined,
    tipoProcessamento: 'NORMAL',
    aplicarFranquia: true,
    aplicarFaturamentoMinimo: false,
    aplicarCancelamentos: true,
    tiposArquivo: [{ id: 1, tipo: 'CONSOLIDACAO', ordem: 1 }]
  });
  
  const [modalTiposAberto, setModalTiposAberto] = useState(false);
  const [modalAssociadosAberto, setModalAssociadosAberto] = useState(false);
  const [associadosVinculados, setAssociadosVinculados] = useState<AssociadoReguaDTO[]>([]);
  const [associadosIdsVinculados, setAssociadosIdsVinculados] = useState<number[]>([]);
  
  useEffect(() => {
    if (isEditMode && id) {
      carregarRegua();
      carregarAssociadosVinculados();
    }
    carregarReguasDisponiveis();
  }, [id]);
  
  const carregarRegua = async () => {
    try {
      setLoading(true);
      const data = await reguaFaturamentoService.buscarPorId(parseInt(id!));
      if (data) {
        setFormData({
          ...data,
          aplicarFranquia: data.aplicarFranquia !== false,
          aplicarFaturamentoMinimo: data.aplicarFaturamentoMinimo === true,
          aplicarCancelamentos: data.aplicarCancelamentos !== false,
          tipoProcessamento: data.tipoProcessamento || 'NORMAL'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar régua:', error);
      showToast('Erro ao carregar dados da régua', 'error');
      navigate('/faturamento/regua');
    } finally {
      setLoading(false);
    }
  };
  
  const carregarReguasDisponiveis = async () => {
    try {
      const reguas = await reguaFaturamentoService.listarAtivos();
      const reguasFiltradas = reguas.filter(r => r.id !== parseInt(id || '0'));
      setReguasDisponiveis(reguasFiltradas);
    } catch (error) {
      console.error('Erro ao carregar réguas disponíveis:', error);
    }
  };
  
  const carregarAssociadosVinculados = async () => {
    if (!id) {
      setAssociadosVinculados([]);
      setAssociadosIdsVinculados([]);
      return;
    }
    
    try {
      setLoadingAssociados(true);
      console.log(`🔍 Carregando associados vinculados para a régua ID: ${id}`);
      
      const response = await api.get(`/regua-faturamento/${id}/associados`);
      let associadosData = response.data;
      
      if (!Array.isArray(associadosData)) {
        if (associadosData && typeof associadosData === 'object') {
          const possibleKeys = ['content', 'itens', 'data', 'list', 'associados'];
          for (const key of possibleKeys) {
            if (associadosData[key] && Array.isArray(associadosData[key])) {
              associadosData = associadosData[key];
              break;
            }
          }
          if (!Array.isArray(associadosData)) {
            associadosData = [];
          }
        } else {
          associadosData = [];
        }
      }
      
      const associadosFormatados: AssociadoReguaDTO[] = associadosData.map((a: any) => ({
        associadoId: a.associadoId || a.id || 0,
        codigoSpc: a.codigoSpc || a.associadoCodigoSpc || a.codigoSocio || '-',
        nomeRazao: a.nomeRazao || a.associadoNome || a.nome || '-',
        nomeFantasia: a.nomeFantasia || '',
        cnpjCpf: a.cnpjCpf || a.associadoCnpjCpf || '',
        status: a.status || 'A',
        dataInicio: a.dataInicio || new Date().toISOString().split('T')[0]
      }));
      
      setAssociadosVinculados(associadosFormatados);
      setAssociadosIdsVinculados(associadosFormatados.map(a => a.associadoId));
      
    } catch (error) {
      console.error('❌ Erro ao carregar associados vinculados:', error);
      setAssociadosVinculados([]);
      setAssociadosIdsVinculados([]);
    } finally {
      setLoadingAssociados(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: target.checked }));
    } else if (name === 'diaEmissao') {
      const dia = parseInt(value);
      setFormData(prev => {
        const novo: ReguaFaturamento = { ...prev, [name]: dia };
        
        if (dia === 1 || dia === 2) {
          novo.periodo = 'PRIMEIRO';
          novo.sequencia = 1;
        } else if (dia === 16) {
          novo.periodo = 'SEGUNDO';
          novo.sequencia = 2;
        } else if (dia === 26) {
          novo.periodo = 'TERCEIRO';
          novo.sequencia = 3;
        }
        
        return novo;
      });
    } else if (name === 'diaVencimento') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || null }));
    } else if (name === 'reguaDestinoMigracaoId') {
      setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSalvarTiposArquivo = (tipos: TipoArquivoRegua[]) => {
    setFormData(prev => ({ 
      ...prev, 
      tiposArquivo: tipos,
      tipoArquivo: tipos.length > 0 ? tipos[0].tipo as any : prev.tipoArquivo,
      ordemImportacao: tipos.length > 0 ? tipos[0].ordem : prev.ordemImportacao
    }));
    showToast('Tipos de arquivo configurados com sucesso!', 'success');
  };
  
  const handleAdicionarAssociados = async (associadosIds: number[], dataInicio: string) => {
    if (!id && !isEditMode) {
      showToast('Salve a régua primeiro antes de adicionar associados', 'warning');
      return;
    }
    
    try {
      for (const associadoId of associadosIds) {
        await reguaFaturamentoService.adicionarAssociadoARegua(parseInt(id!), associadoId, dataInicio);
      }
      showToast(`${associadosIds.length} associado(s) adicionado(s) com sucesso!`, 'success');
      carregarAssociadosVinculados();
    } catch (error) {
      console.error('Erro ao adicionar associados:', error);
      showToast('Erro ao adicionar associados', 'error');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEditMode && id) {
        await reguaFaturamentoService.atualizar(parseInt(id), formData);
        showToast('Régua atualizada com sucesso!', 'success');
        navigate('/faturamento/regua');
      } else {
        const novaRegua = await reguaFaturamentoService.criar(formData);
        showToast('Régua criada com sucesso!', 'success');
        navigate(`/faturamento/regua/editar/${novaRegua.id}`);
      }
    } catch (error: any) {
      console.error('Erro ao salvar régua:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar régua', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading && isEditMode) {
    return <Loading />;
  }
  
  const totalTipos = formData.tiposArquivo?.length || 0;
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb 
        items={[
          { label: 'Faturamento', path: '/faturamento/regua' },
          { label: isEditMode ? 'Editar Régua' : 'Nova Régua' }
        ]}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {isEditMode ? 'Editar Régua de Faturamento' : 'Nova Régua de Faturamento'}
              </h1>
              <p className="text-gray-600 mt-1">
                Configure os períodos de faturamento, regras e tipos de arquivo
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* SEÇÃO 1: IDENTIFICAÇÃO */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  📋 Identificação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Régua *</label>
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Primeiro Período - Consolidação"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      name="descricao"
                      value={formData.descricao || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Descreva o propósito desta régua..."
                    />
                  </div>
                </div>
              </div>
              
              {/* SEÇÃO 2: PERÍODO E DATAS */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  📅 Período e Datas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Emissão *</label>
                    <select
                      name="diaEmissao"
                      value={formData.diaEmissao}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1º dia do mês</option>
                      <option value={2}>2º dia do mês</option>
                      <option value={16}>16º dia do mês</option>
                      <option value={26}>26º dia do mês (Padrão)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento</label>
                    <select
                      name="diaVencimento"
                      value={formData.diaVencimento || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Não definido</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                        <option key={dia} value={dia}>Dia {dia}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período (auto)</label>
                    <input
                      type="text"
                      value={periodos.find(p => p.value === formData.periodo)?.label || ''}
                      disabled
                      className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                    />
                  </div>
                </div>
              </div>
              
              {/* SEÇÃO 3: REGRAS APLICADAS */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🎯 Regras Aplicadas no Faturamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors">
                    <input
                      type="checkbox"
                      name="aplicarFranquia"
                      checked={formData.aplicarFranquia !== false}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <div>
                      <div className="font-medium text-purple-900">🎯 Aplicar Franquia</div>
                      <div className="text-xs text-purple-700 mt-1">
                        Aplica a regra de franquia (remove excedentes)
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-100 transition-colors">
                    <input
                      type="checkbox"
                      name="aplicarFaturamentoMinimo"
                      checked={formData.aplicarFaturamentoMinimo === true}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 text-orange-600 rounded focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-medium text-orange-900">💰 Aplicar Faturamento Mínimo</div>
                      <div className="text-xs text-orange-700 mt-1">
                        Complementa até o valor mínimo do associado
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors">
                    <input
                      type="checkbox"
                      name="aplicarCancelamentos"
                      checked={formData.aplicarCancelamentos !== false}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <div>
                      <div className="font-medium text-red-900">🗑️ Aplicar Cancelamentos</div>
                      <div className="text-xs text-red-700 mt-1">
                        Remove itens cancelados do período
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* SEÇÃO 4: TIPOS DE ARQUIVO */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  📂 Tipos de Arquivo
                </h3>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600">
                    {totalTipos} tipo(s) de arquivo configurado(s)
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalTiposAberto(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Configurar
                  </button>
                </div>
                {totalTipos > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tiposArquivo?.sort((a,b) => a.ordem - b.ordem).map(tipo => (
                      <span key={tipo.id} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {tipo.ordem}º - {
                          tipo.tipo === 'CONSOLIDACAO' ? 'Consolidação' :
                          tipo.tipo === 'PREVIA_CORRENTE' ? 'Prévia Corrente' : 'Prévia Anterior'
                        }
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* SEÇÃO 5: MIGRAÇÃO */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🔄 Migração de Associados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors">
                    <input
                      type="checkbox"
                      name="permiteMigracao"
                      checked={formData.permiteMigracao !== false}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-blue-900">Permite Migração</div>
                      <div className="text-xs text-blue-700 mt-1">
                        Associados podem ser movidos desta régua
                      </div>
                    </div>
                  </label>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Régua Destino Padrão
                    </label>
                    <select
                      name="reguaDestinoMigracaoId"
                      value={formData.reguaDestinoMigracaoId || ''}
                      onChange={handleChange}
                      disabled={formData.permiteMigracao === false}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="">Nenhuma (usar padrão)</option>
                      {reguasDisponiveis.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.nome} {r.ehPadrao ? '(Padrão)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Régua sugerida ao migrar associados desta régua
                    </p>
                  </div>
                </div>
              </div>
              
              {/* SEÇÃO 6: PROCESSAMENTO */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  ⚙️ Processamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Processamento
                    </label>
                    <select
                      name="tipoProcessamento"
                      value={formData.tipoProcessamento || 'NORMAL'}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {tiposProcessamento.map(tp => (
                        <option key={tp.value} value={tp.value}>{tp.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Define como o faturamento é processado
                    </p>
                  </div>
                </div>
              </div>
              
              {/* SEÇÃO 7: APARÊNCIA */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🎨 Aparência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Badge</label>
                    <select
                      name="cor"
                      value={formData.cor}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {cores.map(cor => (
                        <option key={cor.value} value={cor.value}>{cor.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                    <select
                      name="icone"
                      value={formData.icone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {icones.map(icone => (
                        <option key={icone.value} value={icone.value}>{icone.label} {icone.value}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* SEÇÃO 8: STATUS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Régua Ativa</label>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="ehPadrao"
                    checked={formData.ehPadrao}
                    onChange={handleChange}
                    className="h-4 w-4 text-yellow-600 rounded focus:ring-yellow-500"
                  />
                  <label className="text-sm text-gray-700">Régua Padrão</label>
                </div>
                
                {isEditMode && (
                  <button
                    type="button"
                    onClick={() => setModalAssociadosAberto(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    👥 Adicionar Associados
                  </button>
                )}
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/faturamento/regua')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    '💾 Salvar Régua'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {isEditMode && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">👥 Associados da Régua</h2>
                <span className="text-sm text-gray-500">{associadosVinculados.length} vinculado(s)</span>
              </div>
              
              <ListaAssociadosRegua
                reguaId={parseInt(id!)}
                associados={associadosVinculados}
                loading={loadingAssociados}
              />
            </div>
          </div>
        )}
      </div>
      
      {modalTiposAberto && (
        <ModalTiposArquivo
          aberto={modalTiposAberto}
          onFechar={() => setModalTiposAberto(false)}
          tiposExistentes={formData.tiposArquivo || []}
          onSalvar={handleSalvarTiposArquivo}
        />
      )}
      
      {modalAssociadosAberto && (
        <ModalSelecionarAssociados
          aberto={modalAssociadosAberto}
          onFechar={() => setModalAssociadosAberto(false)}
          associadosJaVinculados={associadosIdsVinculados}
          diaEmissaoRegua={formData.diaEmissao}
          onConfirmar={handleAdicionarAssociados}
        />
      )}
    </div>
  );
};

export default ReguaFaturamentoForm;