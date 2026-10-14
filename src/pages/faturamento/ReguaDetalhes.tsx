// src/pages/faturamento/ReguaDetalhes.tsx - VERSÃO CDL
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { reguaFaturamentoService, ReguaFaturamento } from '../../services/reguaFaturamentoService';
import BreadCrumb from '../../components/BreadCrumb';
import Loading from '../../components/Loading';
import EmptyState from '../../components/ui/EmptyState';

interface AssociadoReguaDetalhe {
  id: number;
  associadoId: number;
  associadoNome: string;
  associadoCodigoSpc: string;
  associadoCnpjCpf: string;
  associadoStatus: string;
  dataInicio: string;
  dataFim?: string;
  ativo: boolean;
  motivoMigracao?: string;
  observacao?: string;
}

const ReguaDetalhes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [regua, setRegua] = useState<ReguaFaturamento | null>(null);
  const [associados, setAssociados] = useState<AssociadoReguaDetalhe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { carregarDados(); }, [id]);

  const carregarDados = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const reguaData = await reguaFaturamentoService.buscarPorId(parseInt(id));
      setRegua(reguaData);
      try {
        const associadosData = await reguaFaturamentoService.listarAssociadosPorRegua(parseInt(id));
        setAssociados(associadosData);
      } catch (assocError) {
        console.log('Associados não disponíveis:', assocError);
        setAssociados([]);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar régua');
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => navigate('/faturamento/regua');
  const handleEditarRegua = () => navigate(`/faturamento/regua/editar/${id}`);
  const handleVerAssociado = (associadoId: number) => navigate(`/associados/${associadoId}`);

  const handleRemoverAssociado = async (associadoId: number, nome: string) => {
    if (window.confirm(`Deseja remover o associado "${nome}" da régua?`)) {
      try {
        await reguaFaturamentoService.removerAssociadoDaRegua(associadoId);
        carregarDados();
      } catch (error) {
        console.error('Erro ao remover associado:', error);
        alert('Erro ao remover associado');
      }
    }
  };

  const handleAdicionarAssociados = () => {
    navigate(`/faturamento/regua/editar/${id}`, { state: { openModal: 'associados' } });
  };

  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };

  const formatarCnpjCpf = (cnpjCpf: string) => {
    if (!cnpjCpf) return '-';
    const n = cnpjCpf.replace(/\D/g, '');
    if (n.length === 11) return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (n.length === 14) return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return cnpjCpf;
  };

  const getPeriodoLabel = (periodo: string) => {
    const m: Record<string, string> = {
      'PRIMEIRO': 'Primeiro Período (Dias 1-2)',
      'SEGUNDO': 'Segundo Período (Dia 16)',
      'TERCEIRO': 'Terceiro Período (Dia 26)'
    };
    return m[periodo] || periodo;
  };

  const getTipoArquivoLabel = (tipo: string) => {
    const m: Record<string, string> = {
      'CONSOLIDACAO': 'Consolidação',
      'PREVIA_CORRENTE': 'Prévia Corrente',
      'PREVIA_ANTERIOR': 'Prévia Anterior'
    };
    return m[tipo] || tipo;
  };

  const getStatusColor = (status: string) =>
    status === 'A' ? 'bg-cdl-green-100 text-cdl-green-700' : 'bg-cdl-danger-50 text-cdl-danger-500';
  const getStatusText = (status: string) => status === 'A' ? 'Ativo' : 'Inativo';

  if (loading) return <Loading />;

  if (error || !regua) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <BreadCrumb items={[{ label: 'Faturamento', path: '/faturamento/regua' }, { label: 'Detalhes da Régua' }]} />
        <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
          <button
            onClick={handleVoltar}
            className="px-4 py-2 border border-gray-300 text-cdl-navy-700 rounded-lg
                       hover:bg-cdl-neutral-50 flex items-center gap-2 transition-colors mb-6"
          >
            ← Voltar
          </button>
          <div className="bg-cdl-danger-50 border border-cdl-danger-100 text-cdl-danger-600 px-4 py-3 rounded-lg">
            {error || 'Régua não encontrada'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb items={[{ label: 'Faturamento', path: '/faturamento/regua' }, { label: `Régua: ${regua.nome}` }]} />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-cdl-navy-700">Detalhes da Régua de Faturamento</h1>
              <span className="inline-flex px-3 py-1 text-sm rounded-full bg-cdl-navy-50 text-cdl-navy-700 font-medium">
                {getPeriodoLabel(regua.periodo)}
              </span>
              {regua.ehPadrao && (
                <span className="inline-flex px-3 py-1 text-sm rounded-full bg-cdl-yellow-100 text-cdl-yellow-700 font-medium">
                  ⭐ Padrão
                </span>
              )}
              <span className={`inline-flex px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(regua.ativo ? 'A' : 'I')}`}>
                {getStatusText(regua.ativo ? 'A' : 'I')}
              </span>
            </div>
            <p className="text-gray-600">
              ID: <span className="font-mono text-cdl-navy-700">{regua.id}</span> • Criado em: {formatarData(regua.criadoEm?.split('T')[0])}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleVoltar}
              className="px-4 py-2 border border-gray-300 text-cdl-navy-700 rounded-lg
                         hover:bg-cdl-neutral-50 flex items-center gap-2 transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={handleEditarRegua}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 flex items-center gap-2 font-medium
                         transition-all active:scale-[.98]"
            >
              ✏️ Editar Régua
            </button>
          </div>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Card Informações */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-6 bg-cdl-navy-700 rounded" />
                  <h2 className="text-lg font-semibold text-cdl-navy-700">Informações da Régua</h2>
                </div>
                <button
                  onClick={handleEditarRegua}
                  className="px-3 py-1 bg-cdl-navy-50 text-cdl-navy-700 rounded-lg
                             hover:bg-cdl-navy-100 flex items-center gap-1 transition-colors text-sm font-medium"
                >
                  ✏️ Editar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nome da Régua</label>
                  <p className="text-gray-800 font-medium">{regua.nome}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Período</label>
                  <p className="text-gray-800">{getPeriodoLabel(regua.periodo)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Dia de Emissão</label>
                  <p className="text-gray-800">{regua.diaEmissao}º dia do mês</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Sequência</label>
                  <p className="text-gray-800">{regua.sequencia}º período</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                  <p className="text-gray-800">{regua.descricao || '-'}</p>
                </div>
              </div>
            </div>

            {/* Card Tipos de Arquivo */}
            {regua.tiposArquivo && regua.tiposArquivo.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-6 bg-cdl-yellow-500 rounded" />
                  <h2 className="text-lg font-semibold text-cdl-navy-700">Tipos de Arquivo</h2>
                  <span className="px-2 py-1 text-xs bg-cdl-neutral-100 text-cdl-navy-700 rounded-full font-medium">
                    {regua.tiposArquivo.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-cdl-navy-50">
                      <tr>
                        {['Ordem','Tipo de Arquivo'].map(h => (
                          <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {regua.tiposArquivo.sort((a, b) => a.ordem - b.ordem).map((tipo) => (
                        <tr key={tipo.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {tipo.ordem}º
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="inline-flex px-2 py-1 text-xs rounded-full bg-cdl-navy-50 text-cdl-navy-700 font-medium">
                              {getTipoArquivoLabel(tipo.tipo)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Coluna 2 */}
          <div className="space-y-6">
            {/* Card Estatísticas */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-cdl-green-500 rounded" />
                <h2 className="text-lg font-semibold text-cdl-navy-700">Estatísticas</h2>
              </div>

              <div className="space-y-4">
                <div className="text-center p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                  <div className="text-3xl font-bold text-cdl-navy-700">{associados.length}</div>
                  <div className="text-sm text-cdl-navy-600">Associados na Régua</div>
                </div>

                <div className="text-center p-4 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg">
                  <div className="text-3xl font-bold text-cdl-yellow-700">{regua.tiposArquivo?.length || 0}</div>
                  <div className="text-sm text-cdl-yellow-600">Tipos de Arquivo</div>
                </div>
              </div>
            </div>

            {/* Card Informações Adicionais */}
            <div className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-6 bg-cdl-yellow-500 rounded" />
                <h2 className="text-lg font-semibold text-cdl-navy-700">Informações Adicionais</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ícone</label>
                  <p className="text-2xl">{regua.icone || '📅'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Régua Padrão</label>
                  <p className="text-gray-800">{regua.ehPadrao ? '✅ Sim' : '❌ Não'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Data de Criação</label>
                  <p className="text-gray-800">{formatarData(regua.criadoEm?.split('T')[0])}</p>
                </div>
                {regua.criadoPor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Criado por</label>
                    <p className="text-gray-800">{regua.criadoPor}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card Associados */}
        <div className="mt-6 border border-gray-200 rounded-lg p-6">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-cdl-navy-700 rounded" />
              <h2 className="text-lg font-semibold text-cdl-navy-700">Associados na Régua</h2>
              <span className="px-2 py-1 text-xs bg-cdl-neutral-100 text-cdl-navy-700 rounded-full font-medium">
                {associados.length} associado(s)
              </span>
            </div>
            <button
              onClick={handleAdicionarAssociados}
              className="px-4 py-2 bg-cdl-navy-700 text-white rounded-lg
                         hover:bg-cdl-navy-800 flex items-center gap-2 font-medium
                         transition-all active:scale-[.98] text-sm"
            >
              ➕ Adicionar Associados
            </button>
          </div>

          {associados.length === 0 ? (
            <EmptyState
              icon="👥"
              title="Nenhum associado nesta régua"
              description="Adicione associados para que eles sejam considerados no faturamento deste período."
              action={
                <button
                  onClick={handleAdicionarAssociados}
                  className="px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 transition-all active:scale-[.98]"
                >
                  ➕ Adicionar Associados
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-cdl-navy-50">
                  <tr>
                    {['Código SPC','Associado','CNPJ/CPF','Data Início','Status','Ações'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-cdl-navy-700 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {associados.map((assoc) => (
                    <tr key={assoc.id} className="hover:bg-cdl-navy-50/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-cdl-navy-700">
                        {assoc.associadoCodigoSpc || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{assoc.associadoNome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatarCnpjCpf(assoc.associadoCnpjCpf) || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatarData(assoc.dataInicio)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          assoc.ativo ? 'bg-cdl-green-100 text-cdl-green-700' : 'bg-cdl-danger-50 text-cdl-danger-500'
                        }`}>
                          {assoc.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVerAssociado(assoc.associadoId)}
                            className="text-cdl-navy-700 hover:text-cdl-navy-900 p-1 rounded hover:bg-cdl-navy-50 transition-colors"
                            title="Ver associado"
                          >👁️</button>
                          <button
                            onClick={() => handleRemoverAssociado(assoc.associadoId, assoc.associadoNome)}
                            className="text-cdl-danger-500 hover:text-cdl-danger-600 p-1 rounded hover:bg-cdl-danger-50 transition-colors"
                            title="Remover da régua"
                          >🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReguaDetalhes;