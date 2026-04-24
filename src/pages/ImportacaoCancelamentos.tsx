// src/pages/ImportacaoCancelamentos.tsx

import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import cancelamentoService, { CancelamentoImportacao } from '../services/cancelamentoService';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import ConfirmModal from '../components/ui/ConfirmModal';

const ImportacaoCancelamentos: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [resultado, setResultado] = useState<CancelamentoImportacao[] | null>(null);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDesfazerModal, setShowDesfazerModal] = useState(false);
  const [importacaoId, setImportacaoId] = useState<number | null>(null);
  
  // Configuração
  const [mesReferencia, setMesReferencia] = useState(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const extensao = file.name.split('.').pop()?.toLowerCase();
    if (extensao !== 'csv' && extensao !== 'txt') {
      showToast('Por favor, selecione um arquivo CSV ou TXT', 'error');
      return;
    }
    
    setArquivo(file);
    setResultado(null);
  };
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    const extensao = file.name.split('.').pop()?.toLowerCase();
    if (extensao !== 'csv' && extensao !== 'txt') {
      showToast('Por favor, selecione um arquivo CSV ou TXT', 'error');
      return;
    }
    
    setArquivo(file);
    setResultado(null);
  }, [showToast]);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);
  
  const handleDownloadModelo = () => {
    cancelamentoService.downloadModelo();
    showToast('Modelo baixado com sucesso!', 'success');
  };
  
  const handleConfirmarImportacao = () => {
    if (!arquivo) {
      showToast('Selecione um arquivo para importar', 'error');
      return;
    }
    setShowConfirmModal(true);
  };
  
  const executarImportacao = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    setProgresso(10);
    setMensagemProgresso('Iniciando importação...');
    
    try {
      setProgresso(30);
      setMensagemProgresso('Processando arquivo...');
      
      const resultadoImportacao = await cancelamentoService.importarCancelamentos(
        arquivo, mesReferencia, anoReferencia
      );
      
      setProgresso(100);
      setMensagemProgresso('Importação concluída!');
      setResultado(resultadoImportacao);
      setImportacaoId(Date.now());
      
      const totalRegistros = resultadoImportacao.length;
      const registrosComErro = resultadoImportacao.filter(r => r.erro).length;
      const registrosSucesso = totalRegistros - registrosComErro;
      
      if (registrosComErro === 0) {
        showToast(`${registrosSucesso} cancelamento(s) importado(s) com sucesso!`, 'success');
      } else {
        showToast(`${registrosSucesso} importado(s), ${registrosComErro} com erro`, 'warning');
      }
      
    } catch (error: any) {
      console.error('Erro na importação:', error);
      showToast(error.response?.data?.message || 'Erro ao importar cancelamentos', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDesfazerImportacao = async () => {
    setShowDesfazerModal(false);
    setIsLoading(true);
    
    try {
      await cancelamentoService.desfazerImportacao(mesReferencia, anoReferencia);
      showToast('Importação desfeita com sucesso!', 'success');
      setResultado(null);
      setArquivo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Erro ao desfazer importação:', error);
      showToast(error.response?.data?.message || 'Erro ao desfazer importação', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBaixarLogErros = () => {
    if (!resultado) return;
    
    const erros = resultado.filter(r => r.erro);
    if (erros.length === 0) {
      showToast('Nenhum erro para exportar', 'warning');
      return;
    }
    
    const cabecalho = ['Linha', 'Código Associado', 'Serviços', 'Erro'];
    
    const linhasCSV = erros.map(erro => [
      erro.linha || '',
      erro.codigoAssociado || '',
      erro.servicos && erro.servicos.length > 0 ? erro.servicos.join(', ') : (erro.produtoPersonalizado || ''),
      `"${(erro.erro || '').replace(/"/g, '""')}"`
    ].join(';'));
    
    const conteudo = [cabecalho.join(';'), ...linhasCSV].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `erros_cancelamentos_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Log de erros exportado com ${erros.length} registro(s)!`, 'success');
  };
  
  const handleLimparArquivo = () => {
    setArquivo(null);
    setResultado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PROCESSADO': return 'bg-green-100 text-green-800';
      case 'ERRO': return 'bg-red-100 text-red-800';
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Importação de Cancelamentos" />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Importação de Cancelamentos</h1>
          <p className="text-gray-600">
            Importe cancelamentos de serviços/produtos em lote utilizando um arquivo CSV.
            Os cancelamentos serão aplicados automaticamente no próximo processamento de faturamento.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área de Upload */}
          <div className="lg:col-span-2">
            {/* Configuração do Período */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">📅 Período de Referência</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                  <select
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                  >
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map((mes, idx) => (
                      <option key={idx} value={idx + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                  <input
                    type="number"
                    value={anoReferencia}
                    onChange={(e) => setAnoReferencia(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-lg"
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>
            </div>
            
            {/* Upload */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                arquivo 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-600 mb-2">
                {arquivo ? arquivo.name : 'Arraste o arquivo aqui ou clique para selecionar'}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Formatos aceitos: CSV, TXT (separador: ponto e vírgula)
              </p>
              <p className="text-xs text-gray-400 mb-2">
                Formato esperado: CODIGO;SERVICO1;SERVICO2;SERVICO3;...
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
              >
                Selecionar Arquivo
              </label>
            </div>
            
            {arquivo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-700">Arquivo selecionado:</span>
                  <span className="ml-2 text-gray-600">{arquivo.name}</span>
                  <span className="ml-2 text-sm text-gray-400">
                    ({(arquivo.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <button
                  onClick={handleLimparArquivo}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remover
                </button>
              </div>
            )}
            
            {/* Barra de Progresso */}
            {isLoading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{mensagemProgresso}</span>
                  <span>{Math.round(progresso)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Botões de Ação */}
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                onClick={handleDownloadModelo}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                📥 Baixar Modelo
              </button>
              <button
                onClick={handleConfirmarImportacao}
                disabled={!arquivo || isLoading}
                className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                  !arquivo || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    🚀 Importar Cancelamentos
                  </>
                )}
              </button>
              
              {resultado && resultado.length > 0 && (
                <button
                  onClick={() => setShowDesfazerModal(true)}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  🗑️ Desfazer Importação
                </button>
              )}
            </div>
          </div>
          
          {/* Instruções */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4">📋 Instruções</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>1. Baixe o modelo de arquivo</li>
              <li>2. Preencha os dados no formato CSV</li>
              <li>3. O arquivo deve ter o formato:</li>
              <ul className="ml-6 mt-2 space-y-1 text-xs font-mono">
                <li>• CODIGO;SERVICO1;SERVICO2;SERVICO3</li>
                <li>• 17055;HSM;;</li>
                <li>• 17056;SPC AVISA;HSM;</li>
                <li>• 17057;NFE;SPC AVISA;HSM</li>
              </ul>
              <li>4. Confirme a importação no dialog</li>
              <li>5. Se errar, use o botão "Desfazer Importação"</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 Dica: Os cancelamentos serão aplicados automaticamente no próximo processamento de faturamento para o mesmo período.
              </p>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <p className="text-xs text-yellow-700">
                ⚠️ Atenção: O botão "Desfazer Importação" remove TODOS os cancelamentos do período selecionado.
              </p>
            </div>
          </div>
        </div>
        
        {/* Resultado da Importação */}
        {resultado && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
              <h2 className="text-lg font-semibold text-gray-800">📊 Resultado da Importação</h2>
              
              {resultado.filter(r => r.erro).length > 0 && (
                <button
                  onClick={handleBaixarLogErros}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors shadow-md"
                >
                  <span>📥</span>
                  Baixar Log de Erros ({resultado.filter(r => r.erro).length})
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{resultado.length}</div>
                <div className="text-sm text-gray-600">Total de Registros</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{resultado.filter(r => !r.erro).length}</div>
                <div className="text-sm text-gray-600">Importados com Sucesso</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{resultado.filter(r => r.erro).length}</div>
                <div className="text-sm text-gray-600">Registros com Erro</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {resultado.filter(r => r.valorCancelamento && r.valorCancelamento > 0).length}
                </div>
                <div className="text-sm text-gray-600">Com Valor {'>'} 0</div>
              </div>
            </div>
            
            {/* Lista de Erros */}
            {resultado.filter(r => r.erro).length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setMostrarErros(!mostrarErros)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-800 mb-3"
                >
                  {mostrarErros ? '▼' : '▶'} Detalhes dos Erros ({resultado.filter(r => r.erro).length})
                </button>
                
                {mostrarErros && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Linha</th>
                          <th className="px-4 py-2 text-left">Código</th>
                          <th className="px-4 py-2 text-left">Serviços</th>
                          <th className="px-4 py-2 text-left">Erro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {resultado.filter(r => r.erro).slice(0, 100).map((erro, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-center font-mono">{erro.linha || '-'}</td>
                            <td className="px-4 py-2 font-mono">{erro.codigoAssociado}</td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {erro.servicos && erro.servicos.length > 0 ? (
                                  erro.servicos.map((servico, sIdx) => (
                                    <span key={sIdx} className="px-1 py-0.5 text-xs bg-gray-100 rounded">
                                      {servico}
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-1 py-0.5 text-xs bg-gray-100 rounded">
                                    {erro.produtoPersonalizado || '-'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-red-600">{erro.erro}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {resultado.filter(r => r.erro).length > 100 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Mostrando os primeiros 100 erros de {resultado.filter(r => r.erro).length}. 
                        Baixe o log completo para ver todos os erros.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Tabela de Sucessos - ATUALIZADA COM MÚLTIPLOS SERVIÇOS */}
            {resultado.filter(r => !r.erro).length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-3">✅ Cancelamentos Importados</h3>
                <div className="overflow-x-auto max-h-96">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Código</th>
                        <th className="px-4 py-2 text-left">Serviços a Cancelar</th>
                        <th className="px-4 py-2 text-center">Quantidade</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {resultado.filter(r => !r.erro).map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-mono font-medium">{item.codigoAssociado}</td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {item.servicos && item.servicos.length > 0 ? (
                                item.servicos.map((servico, sIdx) => (
                                  <span key={sIdx} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                    🗑️ {servico}
                                  </span>
                                ))
                              ) : (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                  🗑️ {item.produtoPersonalizado}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              {item.quantidadeServicos || (item.servicos?.length || 1)} serviço(s)
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                              {item.status || 'PENDENTE'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Mensagem quando não há dados */}
            {resultado.filter(r => !r.erro).length === 0 && resultado.filter(r => r.erro).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum registro processado
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* MODAL DE CONFIRMAÇÃO */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executarImportacao}
        title="Confirmar Importação"
        message={`Deseja realmente importar cancelamentos para o período ${mesReferencia}/${anoReferencia}?`}
        confirmText="Sim, Importar"
        cancelText="Cancelar"
        type="warning"
      />
      
      {/* MODAL DE CONFIRMAÇÃO PARA DESFAZER */}
      <ConfirmModal
        isOpen={showDesfazerModal}
        onClose={() => setShowDesfazerModal(false)}
        onConfirm={handleDesfazerImportacao}
        title="Confirmar Desfazer Importação"
        message={`ATENÇÃO: Isso irá REMOVER TODOS os cancelamentos importados para o período ${mesReferencia}/${anoReferencia}. Esta ação não pode ser desfeita.`}
        confirmText="Sim, Remover Tudo"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ImportacaoCancelamentos;