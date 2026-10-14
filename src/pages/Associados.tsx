// src/pages/Associados.tsx - VERSÃO CDL (Skeleton + EmptyState + Paleta)
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  associadoService,
  associadoOpcoes,
  AssociadoResumoDTO,
  AssociadoFiltros
} from '../services/associadoService';
import BreadCrumb from '../components/BreadCrumb';
import { useMessage } from '../providers/MessageProvider';
import { PermissionGuard } from '../components/PermissionGuard';
import { useAuthStore } from '../stores/authStore';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';

/* Hook de debounce (inalterado) */
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const h = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debouncedValue;
};

const AssociadosPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showConfirm } = useMessage();
  const { hasPermission } = useAuthStore();

  const [associados, setAssociados] = useState<AssociadoResumoDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const [inputValues, setInputValues] = useState({
    codigoSpc: '', cnpjCpf: '', nomeRazao: '',
    tipoPessoa: '', status: '', origem: '',
  });

  const [filtrosAtivos, setFiltrosAtivos] = useState<AssociadoFiltros>({
    page: 0, size: 10, sort: 'nomeRazao', direction: 'asc',
  });

  const [paginaInfo, setPaginaInfo] = useState({
    totalElements: 0, totalPages: 0, size: 10, number: 0,
  });

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const nomeInputRef = useRef<HTMLInputElement>(null);
  const codigoSpcInputRef = useRef<HTMLInputElement>(null);

  const debouncedNomeRazao = useDebounce(inputValues.nomeRazao, 500);
  const debouncedCodigoSpc = useDebounce(inputValues.codigoSpc, 500);
  const debouncedCnpjCpf = useDebounce(inputValues.cnpjCpf, 500);

  const filtrosAtivosRef = useRef(filtrosAtivos);
  const carregandoRef = useRef(false);

  useEffect(() => { filtrosAtivosRef.current = filtrosAtivos; }, [filtrosAtivos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const novos: AssociadoFiltros = {
        ...filtrosAtivosRef.current,
        page: 0,
        codigoSpc: debouncedCodigoSpc || undefined,
        cnpjCpf: debouncedCnpjCpf || undefined,
        nomeRazao: debouncedNomeRazao || undefined,
        tipoPessoa: inputValues.tipoPessoa || undefined,
        status: inputValues.status || undefined,
        origem: inputValues.origem || undefined,
      };
      Object.keys(novos).forEach(k => {
        if (novos[k as keyof AssociadoFiltros] === undefined)
          delete novos[k as keyof AssociadoFiltros];
      });
      setFiltrosAtivos(novos);
    }, 50);
    return () => clearTimeout(timer);
  }, [
    debouncedNomeRazao, debouncedCodigoSpc, debouncedCnpjCpf,
    inputValues.tipoPessoa, inputValues.status, inputValues.origem,
  ]);

  const carregarAssociados = async (filtrosParaUsar: AssociadoFiltros) => {
    if (carregandoRef.current) return;
    try {
      carregandoRef.current = true;
      setLoading(true);
      const response = await associadoService.listar(filtrosParaUsar);

      if (response && response.content && Array.isArray(response.content)) {
        setAssociados(response.content);
        setPaginaInfo({
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0,
          size: response.size || 10,
          number: response.number || 0,
        });
      } else if (Array.isArray(response)) {
        setAssociados(response);
        setPaginaInfo({ totalElements: response.length, totalPages: 1, size: 10, number: 0 });
      } else {
        setAssociados([]);
        showToast('Nenhum associado encontrado', 'info');
      }
    } catch (e) {
      console.error(e);
      showToast('Erro ao carregar associados. Tente novamente.', 'error');
      setAssociados([]);
    } finally {
      setLoading(false);
      carregandoRef.current = false;
    }
  };

  useEffect(() => {
    const t = setTimeout(() => carregarAssociados(filtrosAtivos), 100);
    return () => clearTimeout(t);
  }, [filtrosAtivos]);

  useEffect(() => {
    carregarAssociados({ page: 0, size: 10, sort: 'nomeRazao', direction: 'asc' });
  }, []);

  const handleInputChange = (campo: keyof typeof inputValues, valor: string) =>
    setInputValues(prev => ({ ...prev, [campo]: valor }));

  const handleSelectChange = (campo: keyof typeof inputValues, valor: string) => {
    setInputValues(prev => ({ ...prev, [campo]: valor }));
    setFiltrosAtivos(prev => ({ ...prev, [campo]: valor || undefined, page: 0 }));
  };

  const limparFiltros = () => {
    setInputValues({ codigoSpc: '', cnpjCpf: '', nomeRazao: '', tipoPessoa: '', status: '', origem: '' });
    setFiltrosAtivos({ page: 0, size: 10, sort: 'nomeRazao', direction: 'asc' });
    showToast('Filtros limpos', 'info');
    setTimeout(() => nomeInputRef.current?.focus(), 100);
  };

  const handleBuscarAgora = () => {
    setFiltrosAtivos({
      ...filtrosAtivos, page: 0,
      codigoSpc: inputValues.codigoSpc || undefined,
      cnpjCpf: inputValues.cnpjCpf || undefined,
      nomeRazao: inputValues.nomeRazao || undefined,
    });
  };

  const handleNovoAssociado = () => navigate('/associados/novo');
  const handleEditarAssociado = (id: number) => navigate(`/associados/editar/${id}`);
  const handleVerDetalhes = (id: number) => navigate(`/associados/${id}`);
  const handleMigrarRegua = (id: number) => navigate(`/associados/${id}/migrar-regua`);

  const handleExcluirAssociado = async (id: number, nome: string) => {
    const ok = await showConfirm({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o associado "${nome}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!ok) return;
    try {
      await associadoService.excluir(id);
      showToast('Associado excluído com sucesso!', 'success');
      carregarAssociados(filtrosAtivos);
    } catch (error: any) {
      showToast(error.response?.data?.mensagem || 'Erro ao excluir associado.', 'error');
    }
  };

  const handlePaginaChange = (novaPagina: number) =>
    setFiltrosAtivos(prev => ({ ...prev, page: novaPagina }));

  /* -------- formatadores (inalterados) -------- */
  const formatarCnpjCpf = (v: string) => {
    if (!v) return '-';
    const n = v.replace(/\D/g, '');
    if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return v;
  };

  const formatarData = (s?: string): string => {
    if (!s || !s.trim()) return '-';
    try {
      const d = s.trim();
      if (d.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(d)) {
        const obj = new Date(d);
        if (isNaN(obj.getTime())) return '-';
        return `${String(obj.getUTCDate()).padStart(2,'0')}/${String(obj.getUTCMonth()+1).padStart(2,'0')}/${obj.getUTCFullYear()}`;
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(d)) {
        const [dia, mes, ano] = d.split('/');
        return `${dia.padStart(2,'0')}/${mes.padStart(2,'0')}/${ano}`;
      }
      if (/^\d{4}\/\d{1,2}\/\d{1,2}/.test(d)) {
        const [ano, mes, dia] = d.split('/');
        return `${dia.padStart(2,'0')}/${mes.padStart(2,'0')}/${ano}`;
      }
      if (d.includes(' ')) {
        const m = d.match(/(\d{1,2})\s+[^/]*\/(\d{1,2})\/(\d{4})/);
        if (m) return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${m[3]}`;
      }
      return '-';
    } catch { return '-'; }
  };

  const formatarDataCadastro = (s?: string): string => {
    if (!s || !s.trim()) return '-';
    try {
      let p = s.trim();
      if (p.includes(' ')) p = p.split(' ')[0];
      if (p.includes('T')) p = p.split('T')[0];
      const [ano, mes, dia] = p.split('-').map(Number);
      if (!ano || !mes || !dia) return formatarData(s);
      return `${String(dia).padStart(2,'0')}/${String(mes).padStart(2,'0')}/${ano}`;
    } catch { return formatarData(s); }
  };

  const formatarDataFiliacao = (s?: string) => {
    if (!s || !s.trim()) return '-';
    try {
      const p = s.split('T')[0];
      if (!p) return '-';
      const [ano, mes, dia] = p.split('-');
      if (!ano || !mes || !dia) return '-';
      return `${dia.padStart(2,'0')}/${mes.padStart(2,'0')}/${ano}`;
    } catch { return '-'; }
  };

  const formatarDataComStatus = (s?: string) => {
    const f = formatarDataFiliacao(s);
    if (f === '-') return { texto: 'Não informada', classe: 'text-gray-400 italic' };
    try {
      const [d, m, a] = f.split('/').map(Number);
      const data = new Date(a, m - 1, d);
      const hoje = new Date();
      const diff = (hoje.getTime() - data.getTime()) / (1000 * 3600 * 24);
      if (diff <= 30) return { texto: f, classe: 'text-green-600 font-medium' };
      if (diff > 365) return { texto: f, classe: 'text-yellow-600' };
      return { texto: f, classe: 'text-gray-600' };
    } catch { return { texto: f, classe: 'text-gray-600' }; }
  };

  const getStatusColor = (s: string) =>
    ({ A: 'bg-green-100 text-green-800',
       I: 'bg-red-100 text-red-800',
       S: 'bg-yellow-100 text-yellow-800' }[s] ?? 'bg-gray-100 text-gray-800');

  const getTipoPessoaColor = (t: string) =>
    ({ F: 'bg-blue-100 text-blue-800',
       J: 'bg-purple-100 text-purple-800' }[t] ?? 'bg-gray-100 text-gray-800');

  const getStatusText = (s: string) =>
    associadoOpcoes.status.find(o => o.value === s)?.label ?? s;

  const getTipoPessoaText = (t: string) =>
    associadoOpcoes.tipoPessoa.find(o => o.value === t)?.label ?? t;

  const getOrigemText = (o: string) =>
    ({ CADASTRO_MANUAL: 'Cadastro Manual',
       IMPORTACAO_NOVO: 'Novos (Importação)',
       IMPORTACAO_ATUALIZADO: 'Atualizados (Importação)' }[o] ?? o);

  const formatarValor = (v?: number) =>
    !v ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const isFiltrando =
    debouncedNomeRazao !== inputValues.nomeRazao ||
    debouncedCodigoSpc !== inputValues.codigoSpc ||
    debouncedCnpjCpf !== inputValues.cnpjCpf;

  const temFiltroAtivo = Object.values(inputValues).some(v => v);

  /* ------------------ RENDER ------------------ */
  return (
    <div className="p-6">
      <BreadCrumb atual="Associados" />

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Gestão de Associados</h1>
          <p className="text-gray-600">
            Total: <span className="font-semibold text-cdl-navy-700">{paginaInfo.totalElements}</span> associado(s) | Exibindo: {associados.length}
            {isFiltrando && <span className="ml-2 text-cdl-navy-600 text-sm">(buscando...)</span>}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setMostrarFiltros(!mostrarFiltros);
              setTimeout(() => {
                if (nomeInputRef.current && mostrarFiltros === false) nomeInputRef.current.focus();
              }, 100);
            }}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50 transition-colors"
          >
            🔍 {mostrarFiltros ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>

          <button
            onClick={() => carregarAssociados(filtrosAtivos)}
            disabled={loading}
            className="px-4 py-2 bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-100
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '⏳ Carregando...' : '🔄 Atualizar'}
          </button>

          <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
            <button
              onClick={handleNovoAssociado}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg flex items-center gap-2
                         hover:bg-cdl-navy-800 font-medium transition-all active:scale-[.98]"
            >
              ➕ Novo Associado
            </button>
          </PermissionGuard>

          <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
            <button
              onClick={() => navigate('/importacao-associados')}
              className="px-4 py-2 bg-cdl-yellow-gradient text-cdl-navy-900 rounded-lg
                         flex items-center gap-2 font-medium hover:brightness-105
                         transition-all active:scale-[.98]"
            >
              📥 Importar Associados
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-cdl-navy-700">Filtros de Busca</h3>
            <div className="flex gap-2">
              <button
                onClick={handleBuscarAgora}
                disabled={loading}
                className="px-3 py-1.5 bg-cdl-navy-700 text-white text-sm rounded-md
                           hover:bg-cdl-navy-800 disabled:opacity-50 transition-all"
              >
                🔍 Buscar Agora
              </button>
              <button
                onClick={limparFiltros}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >
                🗑️ Limpar Tudo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Código SPC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código SPC
                {inputValues.codigoSpc && debouncedCodigoSpc !== inputValues.codigoSpc && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <input
                ref={codigoSpcInputRef}
                type="text"
                value={inputValues.codigoSpc}
                onChange={(e) => handleInputChange('codigoSpc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
                placeholder="Ex: SPC001"
              />
            </div>

            {/* CNPJ/CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ/CPF
                {inputValues.cnpjCpf && debouncedCnpjCpf !== inputValues.cnpjCpf && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <input
                type="text"
                value={inputValues.cnpjCpf}
                onChange={(e) => handleInputChange('cnpjCpf', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
                placeholder="Digite CPF ou CNPJ"
              />
              <p className="text-xs text-gray-500 mt-1">Busca automática após 0.5s</p>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome/Razão Social
                {inputValues.nomeRazao && debouncedNomeRazao !== inputValues.nomeRazao && (
                  <span className="ml-2 text-xs text-cdl-navy-600">digitando...</span>
                )}
              </label>
              <input
                ref={nomeInputRef}
                type="text"
                value={inputValues.nomeRazao}
                onChange={(e) => handleInputChange('nomeRazao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
                placeholder="Digite para buscar..."
              />
            </div>

            {/* Tipo Pessoa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Pessoa</label>
              <select
                value={inputValues.tipoPessoa}
                onChange={(e) => handleSelectChange('tipoPessoa', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todos os Tipos</option>
                {associadoOpcoes.tipoPessoa.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={inputValues.status}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todos os Status</option>
                {associadoOpcoes.status.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Origem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Origem</label>
              <select
                value={inputValues.origem}
                onChange={(e) => handleSelectChange('origem', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white
                           focus:ring-2 focus:ring-cdl-navy-600 focus:border-cdl-navy-600 transition-colors"
              >
                <option value="">Todas as Origens</option>
                <option value="CADASTRO_MANUAL">✍️ Cadastro Manual</option>
                <option value="IMPORTACAO_NOVO">📥 Novos (Importação)</option>
                <option value="IMPORTACAO_ATUALIZADO">🔄 Atualizados (Importação)</option>
              </select>
            </div>
          </div>

          {/* Chips de filtros ativos */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {inputValues.codigoSpc && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-50 text-cdl-navy-700">
                  Código SPC: {inputValues.codigoSpc}
                </span>
              )}
              {inputValues.cnpjCpf && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-green-50 text-cdl-green-700">
                  CNPJ/CPF: {formatarCnpjCpf(inputValues.cnpjCpf)}
                </span>
              )}
              {inputValues.nomeRazao && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-100 text-cdl-navy-800">
                  Nome: {inputValues.nomeRazao}
                </span>
              )}
              {inputValues.tipoPessoa && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-yellow-100 text-cdl-yellow-700">
                  Tipo: {getTipoPessoaText(inputValues.tipoPessoa)}
                </span>
              )}
              {inputValues.status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-50 text-cdl-navy-600">
                  Status: {getStatusText(inputValues.status)}
                </span>
              )}
              {inputValues.origem && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-cdl-navy-100 text-cdl-navy-700">
                  Origem: {getOrigemText(inputValues.origem)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading && associados.length === 0 ? (
          /* 🎨 Skeleton na carga inicial */
          <TableSkeleton rows={10} cols={7} />
        ) : loading && associados.length > 0 ? (
          /* 🎨 Skeleton suave quando já tem dados (evita "pulo") */
          <div className="relative">
            <div className="opacity-40 pointer-events-none">
              <TableSkeleton rows={associados.length} cols={7} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-cdl flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-cdl-navy-100 border-t-cdl-navy-700" />
                <span className="text-sm font-medium text-cdl-navy-700">Atualizando…</span>
              </div>
            </div>
          </div>
        ) : associados.length === 0 ? (
          /* 🎨 EmptyState CDL */
          <EmptyState
            icon="👥"
            title="Nenhum associado encontrado"
            description={
              temFiltroAtivo
                ? 'Tente ajustar os filtros de busca ou limpe-os para ver todos.'
                : 'Comece cadastrando seu primeiro associado ou importe em lote.'
            }
            action={
              temFiltroAtivo ? (
                <button
                  onClick={limparFiltros}
                  className="px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  🔄 Limpar filtros
                </button>
              ) : (
                <PermissionGuard requiredPermissions={['ASSOCIADO_CREATE']}>
                  <button
                    onClick={handleNovoAssociado}
                    className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                               hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                  >
                    ➕ Criar Primeiro Associado
                  </button>
                </PermissionGuard>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Código SPC','Nome/Razão Social','CNPJ/CPF','Tipo','Status','Data de Filiação','Ações'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {associados.map((associado) => {
                    const df = formatarDataComStatus(associado.dataFiliacao);
                    return (
                      <tr key={associado.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {associado.codigoSpc || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {associado.codigoRm || 'Sem código RM'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{associado.nomeRazao}</div>
                          {associado.nomeFantasia && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{associado.nomeFantasia}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            {associado.planoNome && <span className="mr-2">📋 {associado.planoNome}</span>}
                            {associado.vendedorNome && <span>👤 {associado.vendedorNome}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatarCnpjCpf(associado.cnpjCpf)}</div>
                          <div className="text-xs text-gray-500">
                            {associado.tipoPessoa === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTipoPessoaColor(associado.tipoPessoa)}`}>
                            {getTipoPessoaText(associado.tipoPessoa)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(associado.status)}`}>
                            {getStatusText(associado.status)}
                          </span>
                          {associado.faturamentoMinimo && (
                            <div className="text-xs text-gray-500 mt-1">💰 {formatarValor(associado.faturamentoMinimo)}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${df.classe}`}>{df.texto}</div>
                          {associado.dataFiliacao && associado.dataFiliacao !== '-' && associado.dataCadastro && (
                            <div className="text-xs text-gray-400" title={`Cadastrado em: ${formatarData(associado.dataCadastro)}`}>
                              📅 Cadastro: {formatarDataCadastro(associado.dataCadastro)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex flex-wrap gap-1">
                            <PermissionGuard requiredPermissions={['ASSOCIADO_VIEW']}>
                              <button
                                onClick={() => handleVerDetalhes(associado.id)}
                                className="p-1 text-cdl-navy-700 hover:text-cdl-navy-900 hover:bg-cdl-navy-50 rounded transition-colors"
                                title="Ver detalhes"
                              >👁️</button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermissions={['ASSOCIADO_EDIT']}>
                              <button
                                onClick={() => handleEditarAssociado(associado.id)}
                                className="p-1 text-cdl-yellow-600 hover:text-cdl-yellow-700 hover:bg-cdl-yellow-50 rounded transition-colors"
                                title="Editar"
                              >✏️</button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermissions={['ASSOCIADO_MIGRAR_REGUA']}>
                              <button
                                onClick={() => handleMigrarRegua(associado.id)}
                                className="p-1 text-cdl-navy-600 hover:text-cdl-navy-800 hover:bg-cdl-navy-50 rounded transition-colors"
                                title="Migrar Régua"
                              >🔄</button>
                            </PermissionGuard>
                            <PermissionGuard requiredPermissions={['ASSOCIADO_DELETE']}>
                              <button
                                onClick={() => handleExcluirAssociado(associado.id, associado.nomeRazao)}
                                className="p-1 text-cdl-danger-500 hover:text-cdl-danger-600 hover:bg-cdl-danger-50 rounded transition-colors"
                                title="Excluir"
                              >🗑️</button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginaInfo.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-cdl-neutral-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{associados.length}</span> de{' '}
                    <span className="font-medium">{paginaInfo.totalElements}</span> associados
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number - 1)}
                      disabled={paginaInfo.number === 0}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >← Anterior</button>
                    <span className="text-sm text-gray-700">
                      Página <span className="font-medium">{paginaInfo.number + 1}</span> de{' '}
                      <span className="font-medium">{paginaInfo.totalPages}</span>
                    </span>
                    <button
                      onClick={() => handlePaginaChange(paginaInfo.number + 1)}
                      disabled={paginaInfo.number === paginaInfo.totalPages - 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium
                                 text-gray-700 hover:bg-white hover:border-cdl-navy-300
                                 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >Próxima →</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AssociadosPage;