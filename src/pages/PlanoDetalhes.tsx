import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { planoService, PlanoDTO } from '../services/planoService';
import { planoProdutoFranquiaService } from '../services/planoProdutoFranquiaService';
import { PlanoProdutoFranquia } from '../types/franquia.types';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { useMessage } from '../providers/MessageProvider';

const PlanoDetalhes: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [plano, setPlano] = useState<PlanoDTO | null>(null);
  const [associacoes, setAssociacoes] = useState<PlanoProdutoFranquia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Carregar dados do plano
      const planoData = await planoService.buscarPorId(parseInt(id));
      setPlano(planoData);
      
      // Carregar associações do plano
      try {
        const associacoesData = await planoProdutoFranquiaService.listarPorPlano(parseInt(id));
        setAssociacoes(associacoesData);
      } catch (error) {
        console.log('Nenhuma associação encontrada');
      }
      
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
      showToast('Plano não encontrado', 'error');
      navigate('/planos');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = () => {
    navigate(`/planos/editar/${id}`);
  };

  const handleVoltar = () => {
    navigate('/planos');
  };

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'ATIVO': 'bg-green-100 text-green-800',
      'INATIVO': 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <Loading />;
  if (!plano) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BreadCrumb 
        links={[
          { label: 'Planos', path: '/planos' },
          { label: plano.nome }
        ]}
      />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-800">
                Detalhes do Plano
              </h1>
              <span className={`px-3 py-1 text-sm rounded-full ${getStatusBadge(plano.status)}`}>
                {plano.status}
              </span>
            </div>
            <p className="text-gray-600">
              ID: {plano.id}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleVoltar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              ← Voltar
            </button>
            
            <button
              onClick={handleEditar}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              ✏️ Editar Plano
            </button>
          </div>
        </div>

        {/* Informações do Plano */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              Informações do Plano
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
                <p className="text-gray-800 font-medium">{plano.nome}</p>
              </div>
              
              {plano.descricao && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                  <p className="text-gray-800">{plano.descricao}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Valor</label>
                  <p className="text-gray-800 font-bold text-lg">{formatarValor(plano.valor)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tipo</label>
                  <p className="text-gray-800">{plano.tipoPlano}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Quantidade Mínima</label>
                  <p className="text-gray-800">{plano.quantidadeMinima}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Quantidade Máxima</label>
                  <p className="text-gray-800">{plano.quantidadeMaxima}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Dia do Faturamento</label>
                <p className="text-gray-800">{plano.diaFaturamento}º dia do mês</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${plano.permiteExcedente ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-gray-600">
                    {plano.permiteExcedente ? 'Permite excedente' : 'Não permite excedente'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${plano.faturamentoAntecipado ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm text-gray-600">
                    {plano.faturamentoAntecipado ? 'Faturamento antecipado' : 'Faturamento normal'}
                  </span>
                </div>
              </div>
              
              {plano.observacao && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Observação</label>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">{plano.observacao}</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-green-600 rounded"></div>
              Resumo
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Total de produtos</p>
                <p className="text-2xl font-bold text-blue-700">{associacoes.length}</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 mb-1">Franquias configuradas</p>
                <p className="text-2xl font-bold text-purple-700">
                  {associacoes.filter(a => a.franquiaId).length}
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 mb-1">Valor médio por produto</p>
                <p className="text-2xl font-bold text-yellow-700">
                  {associacoes.length > 0 
                    ? formatarValor(plano.valor / associacoes.length)
                    : formatarValor(0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Produtos e Franquias */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-indigo-600 rounded"></div>
            Produtos e Franquias do Plano
          </h2>
          
          {associacoes.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Nenhum produto associado a este plano</p>
              <p className="text-sm text-gray-400">
                Adicione produtos e franquias na edição do plano
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {associacoes.map((assoc) => (
                <div key={assoc.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-600 mb-1">📋 Produto</p>
                      <p className="font-medium text-gray-800">{assoc.produtoNome}</p>
                      <p className="text-xs text-gray-500">Código: {assoc.produtoCodigo}</p>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-xs text-purple-600 mb-1">📦 Franquia</p>
                      <p className="font-medium text-gray-800">{assoc.franquiaNome}</p>
                      <p className="text-xs text-gray-500">Código: {assoc.franquiaCodigo}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">Limite incluso</p>
                      <p className="text-sm font-medium text-gray-900">{assoc.limiteFranquia} consultas</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500">Período</p>
                      <p className="text-sm font-medium text-gray-900">{assoc.periodoFranquia}</p>
                    </div>
                    
                    {assoc.valorExcedente && (
                      <div>
                        <p className="text-xs text-gray-500">Valor Excedente</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatarValor(assoc.valorExcedente)} por consulta
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={handleVoltar}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            ← Voltar
          </button>
          
          <button
            onClick={handleEditar}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            ✏️ Editar Plano
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlanoDetalhes;