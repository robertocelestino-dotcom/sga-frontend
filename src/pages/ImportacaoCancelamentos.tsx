// src/pages/ImportacaoCancelamentos.tsx - VERSÃO CDL
import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import cancelamentoService, { CancelamentoImportacao } from '../services/cancelamentoService';
import { useMessage } from '../providers/MessageProvider';
import BreadCrumb from '../components/BreadCrumb';
import ConfirmModal from '../components/ui/ConfirmModal';
import EmptyState from '../components/ui/EmptyState';

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
  const [, setImportacaoId] = useState<number | null>(null);

  const [mesReferencia, setMesReferencia] = useState(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- FILE HANDLERS ---------------- */
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

  /* ---------------- IMPORTAR / DESFAZER ---------------- */
  const executarImportacao = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    setProgresso(10);
    setMensagemProgresso('Iniciando importação...');

    try {
      setProgresso(30);
      setMensagemProgresso('Processando arquivo...');

      const resultadoImportacao = await cancelamentoService.importarCancelamentos(
        arquivo!, mesReferencia, anoReferencia
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
      if (fileInputRef.current) fileInputRef.current.value = '';
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
      erro.servicos && erro.servicos.length > 0
        ? erro.servicos.join(', ')
        : (erro.produtoPersonalizado || ''),
      `"${(erro.erro || '').replace(/"/g, '""')}"`,
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /* ---------------- FORMAT ---------------- */
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'PROCESSADO': return 'bg-cdl-green-100 text-cdl-green-700';
      case 'ERRO':       return 'bg-cdl-danger-50 text-cdl-danger-500';
      case 'PENDENTE':   return 'bg-cdl-yellow-100 text-cdl-yellow-700';
      default:           return 'bg-cdl-neutral-100 text-cdl-neutral-500';
    }
  };

  /* ---------------- CONTADORES (evita recalcular várias vezes) ---------------- */
  const totalRegistros   = resultado?.length ?? 0;
  const totalSucesso     = resultado?.filter(r => !r.erro).length ?? 0;
  const totalErros       = resultado?.filter(r => r.erro).length ?? 0;
  const comValorMaiorQueZero = resultado?.filter(r => r.valorCancelamento && r.valorCancelamento > 0).length ?? 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Importação de Cancelamentos" />

      <div className="bg-white rounded-xl shadow-cdl p-6 mt-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-cdl-navy-700 mb-2">Importação de Cancelamentos</h1>
          <p className="text-gray-600">
            Importe cancelamentos de serviços/produtos em lote utilizando um arquivo CSV.
            Os cancelamentos serão aplicados automaticamente no próximo processamento de faturamento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ==================== ÁREA DE UPLOAD ==================== */}
          <div className="lg:col-span-2">
            {/* Configuração do Período */}
            <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
                <span>📅</span> Período de Referência
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Mês</label>
                  <select
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                  >
                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((mes, idx) => (
                      <option key={idx} value={idx + 1}>{mes}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cdl-navy-700 mb-1">Ano</label>
                  <input
                    type="number"
                    value={anoReferencia}
                    onChange={(e) => setAnoReferencia(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white
                               focus:outline-none focus:ring-2 focus:ring-cdl-navy-600
                               focus:border-cdl-navy-600 transition-colors"
                    min={2020}
                    max={2030}
                  />
                </div>
              </div>
            </div>

            {/* Dropzone — EmptyState quando vazio, card verde quando tem arquivo */}
            {!arquivo ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-cdl-navy-400
                           hover:bg-cdl-navy-50 rounded-xl transition-colors cursor-pointer"
              >
                <EmptyState
                  icon="📋"
                  title="Arraste o arquivo aqui ou clique para selecionar"
                  description="Formatos aceitos: CSV, TXT (separador: ponto e vírgula)"
                  action={
                    <div className="flex flex-col items-center gap-3">
                      <label
                        htmlFor="file-upload"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex px-6 py-3 bg-cdl-navy-700 text-white rounded-lg font-medium
                                   hover:bg-cdl-navy-800 cursor-pointer transition-all active:scale-[.98]"
                      >
                        Selecionar Arquivo
                      </label>
                      <div className="bg-cdl-neutral-50 border border-cdl-neutral-100 rounded-lg px-3 py-2 mt-1">
                        <p className="text-xs text-cdl-navy-700 font-mono">
                          CODIGO;SERVICO1;SERVICO2;...
                        </p>
                      </div>
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-cdl-green-400 bg-cdl-green-50 rounded-xl p-8 text-center">
                <div className="text-5xl mb-3">✅</div>
                <p className="font-medium text-cdl-green-700 mb-1">Arquivo pronto para importar</p>
                <p className="text-xs text-cdl-green-600 font-mono mb-4">
                  Formato esperado: CODIGO;SERVICO1;SERVICO2;SERVICO3;...
                </p>
                <label
                  htmlFor="file-upload"
                  className="inline-flex px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg font-medium
                             hover:bg-cdl-navy-800 cursor-pointer transition-all active:scale-[.98] text-sm"
                >
                  Trocar Arquivo
                </label>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />

            {/* Info do arquivo selecionado */}
            {arquivo && (
              <div className="mt-4 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <div className="font-medium text-cdl-navy-700">{arquivo.name}</div>
                    <div className="text-xs text-gray-500">{(arquivo.size / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
                <button
                  onClick={handleLimparArquivo}
                  className="text-cdl-danger-500 hover:text-cdl-danger-600 text-sm font-medium
                             hover:bg-cdl-danger-50 px-3 py-1 rounded transition-colors"
                >
                  Remover
                </button>
              </div>
            )}

            {/* Barra de progresso */}
            {isLoading && (
              <div className="mt-6 p-4 bg-cdl-navy-50 border border-cdl-navy-100 rounded-lg">
                <div className="flex justify-between text-sm text-cdl-navy-700 mb-2">
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-cdl-yellow-500 animate-pulse" />
                    {mensagemProgresso}
                  </span>
                  <span className="font-semibold">{Math.round(progresso)}%</span>
                </div>
                <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-cdl-navy-100">
                  <div
                    className="bg-cdl-yellow-gradient h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleDownloadModelo}
                disabled={isLoading}
                className="px-5 py-2.5 border border-cdl-navy-200 text-cdl-navy-700 bg-white
                           rounded-lg hover:bg-cdl-navy-50 transition-colors flex items-center gap-2
                           font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📥 Baixar Modelo
              </button>
              <button
                onClick={handleConfirmarImportacao}
                disabled={!arquivo || isLoading}
                className={`px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium
                            transition-all active:scale-[.98] ${
                  !arquivo || isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-cdl-navy-700 text-white hover:bg-cdl-navy-800'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Processando...
                  </>
                ) : (
                  <>🚀 Importar Cancelamentos</>
                )}
              </button>

              {resultado && resultado.length > 0 && (
                <button
                  onClick={() => setShowDesfazerModal(true)}
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-cdl-danger-500 text-white rounded-lg
                             hover:bg-cdl-danger-600 transition-all active:scale-[.98]
                             flex items-center gap-2 font-medium disabled:opacity-50"
                >
                  🗑️ Desfazer Importação
                </button>
              )}
            </div>
          </div>

          {/* ==================== INSTRUÇÕES ==================== */}
          <div className="bg-cdl-navy-50 rounded-xl p-6 border border-cdl-navy-100">
            <h3 className="font-semibold text-cdl-navy-700 mb-4 flex items-center gap-2">
              <span>📋</span> Instruções
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li>1. Baixe o modelo de arquivo</li>
              <li>2. Preencha os dados no formato CSV</li>
              <li>3. O arquivo deve ter o formato:</li>
              <ul className="ml-6 mt-2 space-y-1 text-xs font-mono bg-white border border-cdl-navy-100 rounded p-2">
                <li>• CODIGO;SERVICO1;SERVICO2;SERVICO3</li>
                <li>• 17055;HSM;;</li>
                <li>• 17056;SPC AVISA;HSM;</li>
                <li>• 17057;NFE;SPC AVISA;HSM</li>
              </ul>
              <li>4. Confirme a importação no dialog</li>
              <li>5. Se errar, use o botão "Desfazer Importação"</li>
            </ul>

            <div className="mt-4 p-3 bg-cdl-navy-100 border border-cdl-navy-200 rounded-lg">
              <p className="text-xs text-cdl-navy-700">
                💡 <strong>Dica:</strong> Os cancelamentos serão aplicados automaticamente no próximo
                processamento de faturamento para o mesmo período.
              </p>
            </div>

            <div className="mt-4 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg">
              <p className="text-xs text-cdl-yellow-700">
                ⚠️ <strong>Atenção:</strong> O botão "Desfazer Importação" remove <strong>TODOS</strong> os
                cancelamentos do período selecionado.
              </p>
            </div>
          </div>
        </div>

        {/* ==================== RESULTADO ==================== */}
        {resultado && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
              <h2 className="text-lg font-semibold text-cdl-navy-700 flex items-center gap-2">
                <span>📊</span> Resultado da Importação
              </h2>
              {totalErros > 0 && (
                <button
                  onClick={handleBaixarLogErros}
                  className="px-4 py-2 bg-cdl-danger-500 text-white rounded-lg
                             hover:bg-cdl-danger-600 flex items-center gap-2
                             transition-all active:scale-[.98] font-medium shadow-sm"
                >
                  <span>📥</span>
                  Baixar Log de Erros ({totalErros})
                </button>
              )}
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-cdl-navy-700">{totalRegistros}</div>
                <div className="text-sm text-cdl-navy-600 mt-0.5">Total de Registros</div>
              </div>
              <div className="bg-cdl-green-50 border border-cdl-green-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-cdl-green-700">{totalSucesso}</div>
                <div className="text-sm text-cdl-green-600 mt-0.5">✅ Importados</div>
              </div>
              <div className="bg-cdl-danger-50 border border-cdl-danger-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-cdl-danger-500">{totalErros}</div>
                <div className="text-sm text-cdl-danger-500 mt-0.5">❌ Com Erro</div>
              </div>
              <div className="bg-cdl-yellow-50 border border-cdl-yellow-100 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-cdl-yellow-700">{comValorMaiorQueZero}</div>
                <div className="text-sm text-cdl-yellow-600 mt-0.5">💰 Com Valor &gt; 0</div>
              </div>
            </div>

            {/* Lista de erros */}
            {totalErros > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setMostrarErros(!mostrarErros)}
                  className="flex items-center gap-2 text-cdl-danger-500 hover:text-cdl-danger-600
                             mb-3 font-medium transition-colors"
                >
                  {mostrarErros ? '▼' : '▶'} Detalhes dos Erros ({totalErros})
                </button>

                {mostrarErros && (
                  <div className="overflow-x-auto border border-cdl-danger-100 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-cdl-danger-50">
                        <tr>
                          {['Linha','Código','Serviços','Erro'].map(h => (
                            <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-cdl-danger-500 uppercase">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {resultado.filter(r => r.erro).slice(0, 100).map((erro, idx) => (
                          <tr key={idx} className="hover:bg-cdl-danger-50/40">
                            <td className="px-4 py-2 text-center font-mono text-cdl-navy-700">{erro.linha || '-'}</td>
                            <td className="px-4 py-2 font-mono text-cdl-navy-700">{erro.codigoAssociado}</td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {erro.servicos && erro.servicos.length > 0 ? (
                                  erro.servicos.map((servico, sIdx) => (
                                    <span key={sIdx} className="px-2 py-0.5 text-xs bg-cdl-neutral-100 text-cdl-navy-700 rounded">
                                      {servico}
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-2 py-0.5 text-xs bg-cdl-neutral-100 text-cdl-navy-700 rounded">
                                    {erro.produtoPersonalizado || '-'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-cdl-danger-500">{erro.erro}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {totalErros > 100 && (
                      <p className="text-sm text-gray-500 mt-2 text-center py-2 border-t border-cdl-neutral-100">
                        Mostrando os primeiros 100 erros de {totalErros}. Baixe o log completo para ver todos.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tabela de sucessos */}
            {totalSucesso > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-cdl-navy-700 mb-3 flex items-center gap-2">
                  <span>✅</span> Cancelamentos Importados
                </h3>
                <div className="overflow-x-auto max-h-96 border border-cdl-green-100 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-cdl-green-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cdl-green-700 uppercase">Código</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-cdl-green-700 uppercase">Serviços a Cancelar</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-cdl-green-700 uppercase">Quantidade</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-cdl-green-700 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {resultado.filter(r => !r.erro).map((item, idx) => (
                        <tr key={idx} className="hover:bg-cdl-green-50/40 transition-colors">
                          <td className="px-4 py-2 font-mono font-medium text-cdl-navy-700">
                            {item.codigoAssociado}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-wrap gap-1">
                              {item.servicos && item.servicos.length > 0 ? (
                                item.servicos.map((servico, sIdx) => (
                                  <span key={sIdx} className="px-2 py-1 text-xs bg-cdl-danger-50 text-cdl-danger-500 rounded-full font-medium">
                                    🗑️ {servico}
                                  </span>
                                ))
                              ) : (
                                <span className="px-2 py-1 text-xs bg-cdl-danger-50 text-cdl-danger-500 rounded-full font-medium">
                                  🗑️ {item.produtoPersonalizado}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className="px-2 py-1 text-xs bg-cdl-navy-50 text-cdl-navy-700 rounded-full font-medium">
                              {item.quantidadeServicos || (item.servicos?.length || 1)} serviço(s)
                            </span>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(item.status)}`}>
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

            {/* Empty quando nada foi processado */}
            {totalSucesso === 0 && totalErros === 0 && (
              <EmptyState
                icon="📭"
                title="Nenhum registro processado"
                description="O arquivo foi lido, mas nenhum cancelamento foi encontrado."
                compact
              />
            )}
          </div>
        )}
      </div>

      {/* ==================== MODAIS ==================== */}
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

      <ConfirmModal
        isOpen={showDesfazerModal}
        onClose={() => setShowDesfazerModal(false)}
        onConfirm={handleDesfazerImportacao}
        title="Confirmar Desfazer Importação"
        message={`ATENÇÃO: Isso irá REMOVER TODOS os cancelamentos importados para o período ${mesReferencia}/${anoReferencia}.\n\nEsta ação não pode ser desfeita.`}
        confirmText="Sim, Remover Tudo"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ImportacaoCancelamentos;