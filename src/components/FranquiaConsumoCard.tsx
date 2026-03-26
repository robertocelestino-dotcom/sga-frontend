import React from 'react';
import { ConsumoFranquia } from '../types/franquia.types';

interface FranquiaConsumoCardProps {
  consumo: ConsumoFranquia;
  onVerDetalhes?: () => void;
}

const FranquiaConsumoCard: React.FC<FranquiaConsumoCardProps> = ({ consumo, onVerDetalhes }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-green-100 text-green-800';
      case 'ATENCAO': return 'bg-yellow-100 text-yellow-800';
      case 'CRITICO': return 'bg-orange-100 text-orange-800';
      case 'EXCEDIDO': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'Normal';
      case 'ATENCAO': return 'Atenção';
      case 'CRITICO': return 'Crítico';
      case 'EXCEDIDO': return 'Excedido';
      case 'SEM_LIMITE': return 'Sem Limite';
      default: return status;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'bg-green-500';
      case 'ATENCAO': return 'bg-yellow-500';
      case 'CRITICO': return 'bg-orange-500';
      case 'EXCEDIDO': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const mesAno = `${consumo.mes.toString().padStart(2, '0')}/${consumo.ano}`;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{consumo.produtoNome}</h3>
          <p className="text-sm text-gray-500">Franquia: {consumo.franquiaNome}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(consumo.status)}`}>
          {getStatusText(consumo.status)}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Consumo {mesAno}</span>
          <span className="font-medium text-gray-900">
            {consumo.utilizado} / {consumo.limite}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getProgressColor(consumo.status)}`}
            style={{ width: `${Math.min(consumo.percentualUtilizado, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <span className="text-gray-500">Disponível:</span>
          <span className="ml-1 font-medium text-gray-900">{consumo.disponivel}</span>
        </div>
        {consumo.excedente > 0 && (
          <div>
            <span className="text-gray-500">Excedente:</span>
            <span className="ml-1 font-medium text-red-600">{consumo.excedente}</span>
          </div>
        )}
      </div>

      {consumo.valorExcedente && consumo.valorExcedente > 0 && consumo.excedente > 0 && (
        <div className="mb-3 p-2 bg-red-50 rounded-lg">
          <p className="text-xs text-red-700">
            Valor excedente: R$ {(consumo.valorExcedente * consumo.excedente).toFixed(2)}
          </p>
        </div>
      )}

      {onVerDetalhes && (
        <button
          onClick={onVerDetalhes}
          className="w-full mt-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
        >
          Ver Detalhes
        </button>
      )}
    </div>
  );
};

export default FranquiaConsumoCard;
