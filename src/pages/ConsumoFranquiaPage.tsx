import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { consumoFranquiaService } from '../services/consumoFranquiaService';
import { associadoPlanoService } from '../services/associadoPlanoService';
import { ConsumoFranquia, AssociadoPlano } from '../types/franquia.types';
import FranquiaConsumoCard from '../components/FranquiaConsumoCard';
import Loading from '../components/Loading';
import BreadCrumb from '../components/BreadCrumb';
import { useMessage } from '../providers/MessageProvider';

const ConsumoFranquiaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useMessage();
  const associadoId = parseInt(id || '0');

  const [loading, setLoading] = useState(false);
  const [consumos, setConsumos] = useState<ConsumoFranquia[]>([]);
  const [planos, setPlanos] = useState<AssociadoPlano[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');

  const meses = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  useEffect(() => {
    if (associadoId) {
      carregarDados();
    }
  }, [associadoId, anoSelecionado, mesSelecionado]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [consumosData, planosData] = await Promise.all([
        consumoFranquiaService.listarConsumosDoMes(associadoId, anoSelecionado, mesSelecionado),
        associadoPlanoService.listarPlanosAtivos(associadoId)
      ]);
      setConsumos(consumosData);
      setPlanos(planosData);
    } catch (error) {
      console.error('Erro ao carregar consumos:', error);
      showToast('Erro ao carregar dados de consumo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const consumosFiltrados = consumos.filter(consumo => {
    if (filtroStatus === 'TODOS') return true;
    return consumo.status === filtroStatus;
  });

  const totais = {
    totalFranquias: consumos.length,
    comExcedente: consumos.filter(c => c.excedente > 0).length,
    valorTotalExcedente: consumos.reduce((acc, c) => 
      acc + ((c.valorExcedente || 0) * c.excedente), 0
    )
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb 
        links={[
          { label: 'Associados', path: '/associados' },
          { label: 'Consumo de Franquias' }
        ]}
      />

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Consumo de Franquias</h1>
            <p className="text-gray-600 mt-1">
              Acompanhe o consumo das franquias do associado
            </p>
          </div>

          <button
            onClick={carregarDados}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>↻</span>
            Atualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ano
            </label>
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {anos.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mês
            </label>
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>{mes.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="TODOS">Todos</option>
              <option value="NORMAL">Normal</option>
              <option value="ATENCAO">Atenção</option>
              <option value="CRITICO">Crítico</option>
              <option value="EXCEDIDO">Excedido</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="w-full p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600">Total excedente</p>
              <p className="text-lg font-bold text-blue-700">
                R$ {totais.valorTotalExcedente.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Consumo */}
        {consumosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">
              Nenhum consumo registrado para este período
            </p>
            <p className="text-sm text-gray-400">
              Os consumos aparecerão automaticamente quando houver utilizações
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consumosFiltrados.map(consumo => (
              <FranquiaConsumoCard
                key={`${consumo.produtoId}-${consumo.ano}-${consumo.mes}`}
                consumo={consumo}
                onVerDetalhes={() => {
                  // Aqui pode abrir um modal com mais detalhes
                  showToast(`Detalhes de ${consumo.produtoNome}`, 'info');
                }}
              />
            ))}
          </div>
        )}

        {/* Planos do Associado */}
        {planos.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Planos Ativos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planos.map(plano => (
                <div key={plano.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{plano.planoNome}</h3>
                      <p className="text-sm text-gray-500">
                        Adesão: {new Date(plano.dataAdesao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Ativo
                    </span>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    R$ {plano.planoValor?.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {plano.produtosDoPlano?.length || 0} produtos com franquia
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsumoFranquiaPage;