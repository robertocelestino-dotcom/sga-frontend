// src/pages/faturamento/ReguaFaturamentoForm.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reguaFaturamentoService, ReguaFaturamento, TipoArquivoRegua } from '../../services/reguaFaturamentoService';
import { associadoService, AssociadoResumoDTO } from '../../services/associadoService';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import Modal from '../../components/ui/Modal';
import { useMessage } from '../../providers/MessageProvider';
import api from '../../services/api';

const periodos = [
  { value: 'PRIMEIRO', label: 'Primeiro Período (Dias 1-2)' },
  { value: 'SEGUNDO',  label: 'Segundo Período (Dia 16)' },
  { value: 'TERCEIRO', label: 'Terceiro Período (Dia 26)' },
];

const cores = [
  { value: 'blue',   label: 'Azul',      class: 'bg-cdl-navy-100 text-cdl-navy-800' },
  { value: 'green',  label: 'Verde',     class: 'bg-cdl-green-100 text-cdl-green-700' },
  { value: 'purple', label: 'Roxo',      class: 'bg-cdl-navy-100 text-cdl-navy-700' },
  { value: 'orange', label: 'Laranja',   class: 'bg-cdl-yellow-100 text-cdl-yellow-700' },
  { value: 'red',    label: 'Vermelho',  class: 'bg-cdl-danger-50 text-cdl-danger-500' },
  { value: 'indigo', label: 'Índigo',    class: 'bg-cdl-navy-50 text-cdl-navy-700' },
];

const icones = [
  { value: '📅', label: 'Calendário' },
  { value: '📊', label: 'Gráfico' },
  { value: '💰', label: 'Dinheiro' },
  { value: '🏦', label: 'Banco' },
  { value: '📈', label: 'Crescimento' },
  { value: '⚡', label: 'Rápido' },
];

const tiposProcessamento = [
  { value: 'NORMAL',       label: 'Normal' },
  { value: 'EXTEMPORANEO', label: 'Extemporâneo' },
  { value: 'AMBOS',        label: 'Ambos' },
];

interface AssociadoReguaDTO {
  associadoId: number;
  codigoSpc?: string;
  nomeRazao: string;
  nomeFantasia?: string;
  cnpjCpf?: string;
  status: string;
  dataInicio?: string;
}

/* ============================================================
   MODAL: TIPOS DE ARQUIVO
   ============================================================ */
const ModalTiposArquivo: React.FC<{
  aberto: boolean;
  onFechar: () => void;
  tiposExistentes: TipoArquivoRegua[];
  onSalvar: (tipos: TipoArquivoRegua[]) => void;
}> = ({ aberto, onFechar, tiposExistentes, onSalvar }) => {
  const [tipos, setTipos] = useState<TipoArquivoRegua[]>([]);
  const [novoTipo, setNovoTipo] = useState({ tipo: 'CONSOLIDACAO', ordem: 1 });

  useEffect(() => { if (aberto) setTipos([...tiposExistentes]); }, [aberto, tiposExistentes]);

  const adicionarTipo = () => {
    if (!novoTipo.tipo) return;
    const novoId = Math.max(...tipos.map(t => t.id || 0), 0) + 1;
    setTipos([...tipos, { id: novoId, tipo: novoTipo.tipo, ordem: novoTipo.ordem }]);
    setNovoTipo({ tipo: 'CONSOLIDACAO', ordem: tipos.length + 1 });
  };

  const removerTipo = (index: number) => {
    const novos = tipos.filter((_, i) => i !== index);
    novos.forEach((t, i) => t.ordem = i + 1);
    setTipos(novos);
  };

  const alterarOrdem = (index: number, direcao: 'up' | 'down') => {
    if (direcao === 'up' && index > 0) {
      const n = [...tipos];
      [n[index - 1], n[index]] = [n[index], n[index - 1]];
      n.forEach((t, i) => t.ordem = i + 1);
      setTipos(n);
    } else if (direcao === 'down' && index < tipos.length - 1) {
      const n = [...tipos];
      [n[index], n[index + 1]] = [n[index + 1], n[index]];
      n.forEach((t, i) => t.ordem = i + 1);
      setTipos(n);
    }
  };

  const handleSalvar = () => { onSalvar(tipos); onFechar(); };

  const getTipoLabel = (tipo: string) =>
    ({ CONSOLIDACAO: 'Consolidação', PREVIA_CORRENTE: 'Prévia Corrente', PREVIA_ANTERIOR: 'Prévia Anterior' } as any)[tipo] || tipo;

  const inputBase =
    'w-full px-3 py-2 border border-gray-300 rounded-md bg-white transition-colors ' +
    'focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600';

  return (
    <Modal title="Configurar Tipos de Arquivo" onClose={onFechar} size="lg">
      <div className="space-y-4">
        <div className="flex gap-3">
          <select
            value={novoTipo.tipo}
            onChange={(e) => setNovoTipo({ ...novoTipo, tipo: e.target.value })}
            className={inputBase}
          >
            <option value="CONSOLIDACAO">Consolidação</option>
            <option value="PREVIA_CORRENTE">Prévia Corrente</option>
            <option value="PREVIA_ANTERIOR">Prévia Anterior</option>
          </select>
          <button
            onClick={adicionarTipo}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
          >
            Adicionar
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-cdl-navy-50">
              <tr>
                {['Tipo','Ordem','Ações'].map((h, i) => (
                  <th key={h} className={`px-4 py-2 text-xs font-semibold text-cdl-navy-700 uppercase ${
                    i === 2 ? 'text-center' : 'text-left'
                  }`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tipos.map((tipo, idx) => (
                <tr key={tipo.id} className="hover:bg-cdl-navy-50/40">
                  <td className="px-4 py-2 text-gray-900">{getTipoLabel(tipo.tipo)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{tipo.ordem}º</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => alterarOrdem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-cdl-navy-600 hover:text-cdl-navy-800 hover:bg-cdl-navy-50 rounded disabled:opacity-30 transition-colors"
                        >↑</button>
                        <button
                          onClick={() => alterarOrdem(idx, 'down')}
                          disabled={idx === tipos.length - 1}
                          className="p-1 text-cdl-navy-600 hover:text-cdl-navy-800 hover:bg-cdl-navy-50 rounded disabled:opacity-30 transition-colors"
                        >↓</button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removerTipo(idx)}
                      className="text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 px-2 py-1 rounded text-sm transition-colors"
                    >Remover</button>
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

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onFechar}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >Cancelar</button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
          >Salvar</button>
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================
   LISTA: ASSOCIADOS DA RÉGUA (somente leitura com scroll)
   ============================================================ */
const ListaAssociadosRegua: React.FC<{
  reguaId: number;
  associados: AssociadoReguaDTO[];
  loading: boolean;
}> = ({ reguaId: _reguaId, associados, loading }) => {
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
    const f = filtroPesquisa.toLowerCase();
    return getCodigoSpc(assoc).toLowerCase().includes(f) || getNomeRazao(assoc).toLowerCase().includes(f);
  });

  const totalPaginas = Math.ceil(associadosFiltrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const associadosPaginados = associadosFiltrados.slice(inicio, fim);

  const limparFiltro = () => { setFiltroPesquisa(''); setPaginaAtual(1); };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filtro */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          placeholder="Buscar por Código SPC ou Nome..."
          value={filtroPesquisa}
          onChange={(e) => { setFiltroPesquisa(e.target.value); setPaginaAtual(1); }}
          className="w-full px-3 py-2 pl-9 pr-8 text-sm border border-gray-300 rounded-md
                     focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
        />
        {filtroPesquisa && (
          <button
            onClick={limparFiltro}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cdl-navy-700 text-sm"
          >✕</button>
        )}
      </div>

      {/* Contador */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {filtroPesquisa
            ? `${associadosFiltrados.length} de ${associados.length} encontrados`
            : `Total: ${associados.length} associado(s)`}
        </span>
        {associadosFiltrados.length > 0 && (
          <span>Mostrando {inicio + 1}-{Math.min(fim, associadosFiltrados.length)}</span>
        )}
      </div>

      {associadosFiltrados.length === 0 ? (
        <div className="text-center py-8 bg-cdl-neutral-50 rounded-lg border border-cdl-neutral-100">
          <p className="text-gray-500 text-sm">
            {filtroPesquisa
              ? `Nenhum associado encontrado com "${filtroPesquisa}"`
              : 'Nenhum associado vinculado a esta régua'}
          </p>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
            <table className="min-w-full">
              <thead className="bg-cdl-navy-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">Código SPC</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">Nome/Razão Social</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {associadosPaginados.map((assoc) => (
                  <tr key={assoc.associadoId} className="hover:bg-cdl-navy-50/40 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="font-mono text-xs font-medium text-cdl-navy-700">{getCodigoSpc(assoc)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-800 truncate max-w-[200px]" title={getNomeRazao(assoc)}>
                        {getNomeRazao(assoc)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 gap-1">
              {[
                { label: '⏮️', title: 'Primeira',  disabled: paginaAtual === 1,             onClick: () => setPaginaAtual(1) },
                { label: '◀',  title: 'Anterior',  disabled: paginaAtual === 1,             onClick: () => setPaginaAtual(p => Math.max(1, p - 1)) },
                { label: '▶',  title: 'Próxima',   disabled: paginaAtual === totalPaginas,  onClick: () => setPaginaAtual(p => Math.min(totalPaginas, p + 1)) },
                { label: '⏭️', title: 'Última',    disabled: paginaAtual === totalPaginas,  onClick: () => setPaginaAtual(totalPaginas) },
              ].map((btn, i) => (
                i === 2 ? (
                  <div key="pgnum" className="flex items-center gap-1">
                    <button
                      onClick={btn.onClick}
                      disabled={btn.disabled}
                      title={btn.title}
                      className="px-2 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40
                                 disabled:cursor-not-allowed hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors"
                    >{btn.label}</button>
                    <span className="text-xs text-cdl-navy-700 whitespace-nowrap px-1 font-medium">
                      {paginaAtual} / {totalPaginas}
                    </span>
                  </div>
                ) : (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    disabled={btn.disabled}
                    title={btn.title}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg disabled:opacity-40
                               disabled:cursor-not-allowed hover:bg-cdl-navy-50 hover:border-cdl-navy-300 transition-colors"
                  >{btn.label}</button>
                )
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/* ============================================================
   MODAL: SELECIONAR ASSOCIADOS
   ============================================================ */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const carregarAssociados = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await associadoService.listar({ page: 0, size: 1000, sort: 'nomeRazao', direction: 'asc' });
      let associados: any[] = [];
      if (response && response.content && Array.isArray(response.content)) associados = response.content;
      else if (response && Array.isArray(response)) associados = response;
      setAssociadosDisponiveis(associados.filter(a => a.status === 'A'));
    } catch (error: any) {
      console.error('Erro ao carregar associados:', error);
      setError(error.message || 'Erro ao carregar associados');
    } finally {
      setLoading(false);
    }
  };

  const associadosFiltrados = associadosDisponiveis.filter(assoc => {
    if (associadosJaVinculados.includes(assoc.id)) return false;
    if (!filtro) return true;
    const f = filtro.toLowerCase();
    return (
      (assoc.nomeRazao && assoc.nomeRazao.toLowerCase().includes(f)) ||
      (assoc.nomeFantasia && assoc.nomeFantasia.toLowerCase().includes(f)) ||
      (assoc.codigoSpc && assoc.codigoSpc.toLowerCase().includes(f)) ||
      (assoc.cnpjCpf && assoc.cnpjCpf.includes(filtro))
    );
  });

  const toggleSelecionarTodos = () => {
    const ids = associadosFiltrados.map(a => a.id);
    if (associadosSelecionados.length === ids.length && ids.length > 0) setAssociadosSelecionados([]);
    else setAssociadosSelecionados(ids);
  };

  const toggleAssociado = (id: number) => {
    if (associadosSelecionados.includes(id)) setAssociadosSelecionados(associadosSelecionados.filter(i => i !== id));
    else setAssociadosSelecionados([...associadosSelecionados, id]);
  };

  const handleConfirmar = () => {
    if (associadosSelecionados.length === 0) return;
    onConfirmar(associadosSelecionados, dataInicio);
    onFechar();
  };

  const handleFechar = () => { setAssociadosSelecionados([]); setFiltro(''); onFechar(); };
  const limparFiltro = () => setFiltro('');

  const totalSelecionados = associadosSelecionados.length;
  const totalDisponiveis = associadosFiltrados.length;

  return (
    <Modal title="Selecionar Associados" onClose={handleFechar} size="xl">
      <div className="space-y-4">
        <div className="p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span className="text-sm text-cdl-navy-700">
              Régua para faturamento no dia <strong>{diaEmissaoRegua}</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-cdl-neutral-50 border border-cdl-neutral-100 rounded-lg">
          <label className="text-sm font-medium text-cdl-navy-700 whitespace-nowrap">Data de início na régua:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md bg-white
                       focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
          />
          <span className="text-xs text-gray-500">Os associados serão ativos a partir desta data</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Pesquisar por nome, código SPC ou CNPJ/CPF..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full px-3 py-2 pl-9 pr-10 border border-gray-300 rounded-md
                         focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
            />
            {filtro && (
              <button
                type="button"
                onClick={limparFiltro}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cdl-navy-700"
              >✕</button>
            )}
          </div>
          <button
            type="button"
            onClick={toggleSelecionarTodos}
            disabled={totalDisponiveis === 0}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg hover:bg-cdl-navy-50 disabled:opacity-50 transition-colors font-medium"
          >
            {totalSelecionados === totalDisponiveis && totalDisponiveis > 0 ? 'Desmarcar Todos' : 'Marcar Todos'}
          </button>
        </div>

        {filtro && (
          <div className="text-sm text-gray-500">
            Encontrados {associadosFiltrados.length} resultado(s) para "{filtro}"
          </div>
        )}

        <div className="border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
              <p className="mt-2 text-cdl-navy-700 font-medium text-sm">Carregando associados...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-cdl-danger-500 mb-2">Erro ao carregar associados: {error}</p>
              <button
                onClick={carregarAssociados}
                className="text-cdl-navy-700 hover:text-cdl-navy-900 underline text-sm"
              >Tentar novamente</button>
            </div>
          ) : associadosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {associadosDisponiveis.length === 0 ? (
                <>
                  <p className="mb-2">Nenhum associado ativo cadastrado no sistema.</p>
                  <a
                    href="/associados/novo"
                    className="text-cdl-navy-700 hover:text-cdl-navy-900 underline text-sm"
                  >Clique aqui para cadastrar um associado</a>
                </>
              ) : filtro ? (
                <p>Nenhum associado encontrado com o filtro "{filtro}"</p>
              ) : (
                <p>Todos os associados já estão vinculados a esta régua.</p>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cdl-navy-50 sticky top-0">
                <tr>
                  <th className="w-10 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={totalSelecionados === associadosFiltrados.length && associadosFiltrados.length > 0}
                      onChange={toggleSelecionarTodos}
                      className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                  </th>
                  {['Código SPC','Nome/Razão Social','CNPJ/CPF','Status'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {associadosFiltrados.map((assoc) => (
                  <tr
                    key={assoc.id}
                    className="hover:bg-cdl-navy-50/40 cursor-pointer transition-colors"
                    onClick={() => toggleAssociado(assoc.id)}
                  >
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={associadosSelecionados.includes(assoc.id)}
                        onChange={() => toggleAssociado(assoc.id)}
                        className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                      />
                    </td>
                    <td className="px-4 py-2 font-mono text-sm text-cdl-navy-700">{assoc.codigoSpc || '-'}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900">{assoc.nomeRazao}</div>
                      {assoc.nomeFantasia && <div className="text-xs text-gray-500">{assoc.nomeFantasia}</div>}
                    </td>
                    <td className="px-4 py-2 text-sm font-mono">{assoc.cnpjCpf || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                        assoc.status === 'A' ? 'bg-cdl-green-100 text-cdl-green-700' :
                        assoc.status === 'I' ? 'bg-cdl-danger-50 text-cdl-danger-500' :
                        'bg-cdl-yellow-100 text-cdl-yellow-700'
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {totalDisponiveis > 0 ? (
              <>
                <span className="font-medium text-cdl-navy-700">{associadosFiltrados.length}</span> associado(s) disponível(is) |{" "}
                <span className="font-medium text-cdl-navy-700 ml-1">{totalSelecionados}</span> selecionado(s)
              </>
            ) : (
              <span className="text-cdl-yellow-700">⚠️ Nenhum associado disponível para adicionar</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleFechar}
              className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                         rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
            >Cancelar</button>
            <button
              onClick={handleConfirmar}
              disabled={associadosSelecionados.length === 0}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 disabled:opacity-50 font-medium
                         transition-all active:scale-[.98]"
            >
              Adicionar {associadosSelecionados.length} Associado(s)
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
const ReguaFaturamentoForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useMessage();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [loadingAssociados, setLoadingAssociados] = useState(false);
  const [reguasDisponiveis, setReguasDisponiveis] = useState<ReguaFaturamento[]>([]);

  const [formData, setFormData] = useState<ReguaFaturamento>({
    nome: '', descricao: '',
    diaEmissao: 1, diaVencimento: 10,
    periodo: 'TERCEIRO', sequencia: 3,
    tipoArquivo: 'CONSOLIDACAO', ordemImportacao: 1,
    ehPadrao: false, ativo: true,
    cor: 'blue', icone: '📅',
    permiteMigracao: true, reguaDestinoMigracaoId: undefined,
    tipoProcessamento: 'NORMAL',
    aplicarFranquia: true, aplicarFaturamentoMinimo: false, aplicarCancelamentos: true,
    tiposArquivo: [{ id: 1, tipo: 'CONSOLIDACAO', ordem: 1 }],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          tipoProcessamento: data.tipoProcessamento || 'NORMAL',
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
      setReguasDisponiveis(reguas.filter(r => r.id !== parseInt(id || '0')));
    } catch (error) {
      console.error('Erro ao carregar réguas disponíveis:', error);
    }
  };

  const carregarAssociadosVinculados = async () => {
    if (!id) { setAssociadosVinculados([]); setAssociadosIdsVinculados([]); return; }
    try {
      setLoadingAssociados(true);
      const response = await api.get(`/regua-faturamento/${id}/associados`);
      let associadosData = response.data;
      if (!Array.isArray(associadosData)) {
        if (associadosData && typeof associadosData === 'object') {
          const keys = ['content', 'itens', 'data', 'list', 'associados'];
          for (const key of keys) {
            if (associadosData[key] && Array.isArray(associadosData[key])) { associadosData = associadosData[key]; break; }
          }
          if (!Array.isArray(associadosData)) associadosData = [];
        } else associadosData = [];
      }
      const fmt: AssociadoReguaDTO[] = associadosData.map((a: any) => ({
        associadoId: a.associadoId || a.id || 0,
        codigoSpc: a.codigoSpc || a.associadoCodigoSpc || a.codigoSocio || '-',
        nomeRazao: a.nomeRazao || a.associadoNome || a.nome || '-',
        nomeFantasia: a.nomeFantasia || '',
        cnpjCpf: a.cnpjCpf || a.associadoCnpjCpf || '',
        status: a.status || 'A',
        dataInicio: a.dataInicio || new Date().toISOString().split('T')[0],
      }));
      setAssociadosVinculados(fmt);
      setAssociadosIdsVinculados(fmt.map(a => a.associadoId));
    } catch (error) {
      console.error('Erro ao carregar associados vinculados:', error);
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
        if (dia === 1 || dia === 2) { novo.periodo = 'PRIMEIRO'; novo.sequencia = 1; }
        else if (dia === 16) { novo.periodo = 'SEGUNDO'; novo.sequencia = 2; }
        else if (dia === 26) { novo.periodo = 'TERCEIRO'; novo.sequencia = 3; }
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
      ...prev, tiposArquivo: tipos,
      tipoArquivo: tipos.length > 0 ? tipos[0].tipo as any : prev.tipoArquivo,
      ordemImportacao: tipos.length > 0 ? tipos[0].ordem : prev.ordemImportacao,
    }));
    showToast('Tipos de arquivo configurados com sucesso!', 'success');
  };

  const handleAdicionarAssociados = async (associadosIds: number[], dataInicio: string) => {
    if (!id && !isEditMode) { showToast('Salve a régua primeiro antes de adicionar associados', 'warning'); return; }
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
        const nova = await reguaFaturamentoService.criar(formData);
        showToast('Régua criada com sucesso!', 'success');
        navigate(`/faturamento/regua/editar/${nova.id}`);
      }
    } catch (error: any) {
      console.error('Erro ao salvar régua:', error);
      showToast(error.response?.data?.message || 'Erro ao salvar régua', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <Loading />;

  const totalTipos = formData.tiposArquivo?.length || 0;

  // Classes utilitárias
  const inputBase =
    'w-full px-3 py-2 border border-gray-300 rounded-md bg-white transition-colors ' +
    'focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600';

  const inputDisabled =
    'w-full px-3 py-2 bg-cdl-neutral-50 border border-gray-200 rounded-md text-cdl-navy-700 font-medium';

  return (
    <div className="p-6">
      <BreadCrumb atual={isEditMode ? 'Editar Régua' : 'Nova Régua'} />

      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">
            {isEditMode ? 'Editar Régua de Faturamento' : 'Nova Régua de Faturamento'}
          </h1>
          <p className="text-gray-600">
            Configure os períodos de faturamento, regras e tipos de arquivo
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('/faturamento/regua')}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            ✕ Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                       hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Salvando...
              </>
            ) : (
              <>💾 Salvar Régua</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ===== Seção 1: Identificação ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">📋 Identificação</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Régua <span className="text-cdl-danger-500">*</span>
                    </label>
                    <input
                      type="text" name="nome" value={formData.nome} onChange={handleChange} required
                      className={inputBase}
                      placeholder="Ex: Primeiro Período - Consolidação"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      name="descricao" value={formData.descricao || ''} onChange={handleChange} rows={3}
                      className={`${inputBase} resize-none`}
                      placeholder="Descreva o propósito desta régua..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Seção 2: Período e Datas ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">📅 Período e Datas</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dia de Emissão <span className="text-cdl-danger-500">*</span>
                    </label>
                    <select name="diaEmissao" value={formData.diaEmissao} onChange={handleChange} className={inputBase}>
                      <option value={1}>1º dia do mês</option>
                      <option value={2}>2º dia do mês</option>
                      <option value={16}>16º dia do mês</option>
                      <option value={26}>26º dia do mês (Padrão)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia de Vencimento</label>
                    <select name="diaVencimento" value={formData.diaVencimento || ''} onChange={handleChange} className={inputBase}>
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
                      className={inputDisabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Seção 3: Regras ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">🎯 Regras Aplicadas no Faturamento</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-start gap-3 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg cursor-pointer hover:bg-cdl-navy-100/60 transition-colors">
                    <input
                      type="checkbox" name="aplicarFranquia" checked={formData.aplicarFranquia !== false}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                    <div>
                      <div className="font-medium text-cdl-navy-700">🎯 Aplicar Franquia</div>
                      <div className="text-xs text-cdl-navy-600 mt-1">Aplica a regra de franquia (remove excedentes)</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg cursor-pointer hover:bg-cdl-yellow-100/60 transition-colors">
                    <input
                      type="checkbox" name="aplicarFaturamentoMinimo" checked={formData.aplicarFaturamentoMinimo === true}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 text-cdl-yellow-600 rounded focus:ring-cdl-yellow-500"
                    />
                    <div>
                      <div className="font-medium text-cdl-yellow-700">💰 Aplicar Faturamento Mínimo</div>
                      <div className="text-xs text-cdl-yellow-600 mt-1">Complementa até o valor mínimo do associado</div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 bg-cdl-danger-50 border border-cdl-danger-100 rounded-lg cursor-pointer hover:bg-cdl-danger-100/40 transition-colors">
                    <input
                      type="checkbox" name="aplicarCancelamentos" checked={formData.aplicarCancelamentos !== false}
                      onChange={handleChange}
                      className="mt-1 h-5 w-5 text-cdl-danger-500 rounded focus:ring-cdl-danger-500"
                    />
                    <div>
                      <div className="font-medium text-cdl-danger-600">🗑️ Aplicar Cancelamentos</div>
                      <div className="text-xs text-cdl-danger-500 mt-1">Remove itens cancelados do período</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* ===== Seção 4: Tipos de Arquivo ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">📂 Tipos de Arquivo</h3>
              </div>
              <div className="p-6">
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-cdl-neutral-50 border border-cdl-neutral-100 rounded-lg text-cdl-navy-700 font-medium">
                    {totalTipos} tipo(s) de arquivo configurado(s)
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalTiposAberto(true)}
                    className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                               hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
                  >Configurar</button>
                </div>
                {totalTipos > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.tiposArquivo?.sort((a, b) => a.ordem - b.ordem).map(tipo => (
                      <span key={tipo.id} className="inline-flex items-center px-2 py-1 text-xs bg-cdl-navy-50 text-cdl-navy-700 rounded-full font-medium">
                        {tipo.ordem}º - {
                          tipo.tipo === 'CONSOLIDACAO' ? 'Consolidação'
                          : tipo.tipo === 'PREVIA_CORRENTE' ? 'Prévia Corrente'
                          : 'Prévia Anterior'
                        }
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ===== Seção 5: Migração ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">🔄 Migração de Associados</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="flex items-center gap-3 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg cursor-pointer hover:bg-cdl-navy-100/60 transition-colors">
                    <input
                      type="checkbox" name="permiteMigracao" checked={formData.permiteMigracao !== false}
                      onChange={handleChange}
                      className="h-5 w-5 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                    <div>
                      <div className="font-medium text-cdl-navy-700">Permite Migração</div>
                      <div className="text-xs text-cdl-navy-600 mt-1">Associados podem ser movidos desta régua</div>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Régua Destino Padrão</label>
                    <select
                      name="reguaDestinoMigracaoId" value={formData.reguaDestinoMigracaoId || ''}
                      onChange={handleChange} disabled={formData.permiteMigracao === false}
                      className={`${inputBase} disabled:bg-cdl-neutral-50`}
                    >
                      <option value="">Nenhuma (usar padrão)</option>
                      {reguasDisponiveis.map(r => (
                        <option key={r.id} value={r.id}>{r.nome} {r.ehPadrao ? '(Padrão)' : ''}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Régua sugerida ao migrar associados desta régua</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Seção 6: Processamento ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">⚙️ Processamento</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Processamento</label>
                    <select
                      name="tipoProcessamento" value={formData.tipoProcessamento || 'NORMAL'} onChange={handleChange}
                      className={inputBase}
                    >
                      {tiposProcessamento.map(tp => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Define como o faturamento é processado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Seção 7: Aparência ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">🎨 Aparência</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor do Badge</label>
                    <select name="cor" value={formData.cor} onChange={handleChange} className={inputBase}>
                      {cores.map(cor => <option key={cor.value} value={cor.value}>{cor.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ícone</label>
                    <select name="icone" value={formData.icone} onChange={handleChange} className={inputBase}>
                      {icones.map(ic => <option key={ic.value} value={ic.value}>{ic.label} {ic.value}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Seção 8: Status ===== */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex items-center gap-2">
                <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                <h3 className="text-lg font-semibold text-cdl-navy-700">✅ Status</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="flex items-center gap-3 p-3 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg cursor-pointer hover:bg-cdl-navy-100/60 transition-colors">
                    <input
                      type="checkbox" name="ativo" checked={formData.ativo} onChange={handleChange}
                      className="h-4 w-4 text-cdl-navy-700 rounded focus:ring-cdl-navy-600"
                    />
                    <span className="text-sm text-cdl-navy-700 font-medium">Régua Ativa</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg cursor-pointer hover:bg-cdl-yellow-100/60 transition-colors">
                    <input
                      type="checkbox" name="ehPadrao" checked={formData.ehPadrao} onChange={handleChange}
                      className="h-4 w-4 text-cdl-yellow-600 rounded focus:ring-cdl-yellow-500"
                    />
                    <span className="text-sm text-cdl-yellow-700 font-medium">Régua Padrão</span>
                  </label>

                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => setModalAssociadosAberto(true)}
                      className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                                 hover:bg-cdl-navy-800 flex items-center justify-center gap-2 font-medium
                                 transition-all active:scale-[.98]"
                    >
                      👥 Adicionar Associados
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-cdl-neutral-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/faturamento/regua')}
                  className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                             rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
                >✕ Cancelar</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                             hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>💾 Salvar Régua</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ===== Sidebar: Associados ===== */}
        {isEditMode && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden lg:sticky lg:top-6">
              <div className="px-6 py-4 border-b border-gray-200 bg-cdl-navy-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-cdl-navy-700 rounded"></div>
                  <h2 className="text-lg font-semibold text-cdl-navy-700">👥 Associados da Régua</h2>
                </div>
                <span className="text-sm text-cdl-navy-600 bg-white px-2 py-0.5 rounded-full font-medium border border-cdl-navy-100">
                  {associadosVinculados.length}
                </span>
              </div>
              <div className="p-4">
                <ListaAssociadosRegua
                  reguaId={parseInt(id!)}
                  associados={associadosVinculados}
                  loading={loadingAssociados}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
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