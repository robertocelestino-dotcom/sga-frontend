// src/pages/ImportacaoAssociados.tsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { associadoImportacaoService } from '../services/associadoImportacaoService';
import BreadCrumb from '../components/BreadCrumb';
import Loading from '../components/Loading';
import { useMessage } from '../providers/MessageProvider';

// Tipos para importação
interface AssociadoImportacaoLinha {
  linha: number;
  tipoPessoa: 'F' | 'J';
  cnpjCpf: string;
  nomeRazao: string;
  nomeFantasia?: string;
  codigoVendedor?: string;
  codigoVendedorExterno?: string;
  codigoPlano?: string;
  codigoCategoria?: string;
  codigoSpc?: string;
  codigoRm?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  ddd?: string;
  telefone?: string;
  email?: string;
  faturamentoMinimo?: number;
  dataFiliacao?: string;
  status?: 'A' | 'I' | 'S';
  erros?: string[];
}

interface ResultadoImportacao {
  totalLinhas: number;
  linhasProcessadas: number;
  linhasComErro: number;
  associadosImportados: number;
  criados?: number;
  atualizados?: number;
  configuracoesCriadas?: number;
  erros: Array<{
    linha: number;
    mensagem: string;
    dados: AssociadoImportacaoLinha;
  }>;
}

const ImportacaoAssociados: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();
  
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [progressoAnimado, setProgressoAnimado] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🔥 ANIMAÇÃO DO PROGRESSO
  useEffect(() => {
    if (progresso > progressoAnimado) {
      const timer = setTimeout(() => {
        setProgressoAnimado(prev => Math.min(prev + 1, progresso));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [progresso, progressoAnimado]);
  
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
    setProgresso(0);
    setProgressoAnimado(0);
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
    setProgresso(0);
    setProgressoAnimado(0);
  }, [showToast]);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);
  
  const handleDownloadModelo = () => {
    associadoImportacaoService.downloadModelo();
    showToast('Modelo baixado com sucesso!', 'success');
  };
  
  const handleBaixarLogErros = () => {
    if (!resultado || resultado.erros.length === 0) {
      showToast('Nenhum erro para exportar', 'warning');
      return;
    }
    
    const cabecalho = [
      'Linha', 'Erro', 'Tipo Pessoa', 'CNPJ/CPF', 'Nome/Razão Social',
      'Nome Fantasia', 'Código Vendedor', 'Código Vendedor Externo',
      'Código Plano', 'Código Categoria', 'Código SPC', 'Código RM',
      'CEP', 'Logradouro', 'Número', 'Complemento', 'Bairro',
      'Cidade', 'Estado', 'DDD', 'Telefone', 'Email',
      'Faturamento Mínimo', 'Data Filiação', 'Status'
    ];
    
    const linhasCSV = resultado.erros.map(erro => {
      const dados = erro.dados;
      return [
        erro.linha,
        `"${erro.mensagem.replace(/"/g, '""')}"`,
        dados.tipoPessoa || '',
        dados.cnpjCpf || '',
        `"${(dados.nomeRazao || '').replace(/"/g, '""')}"`,
        `"${(dados.nomeFantasia || '').replace(/"/g, '""')}"`,
        dados.codigoVendedor || '',
        dados.codigoVendedorExterno || '',
        dados.codigoPlano || '',
        dados.codigoCategoria || '',
        dados.codigoSpc || '',
        dados.codigoRm || '',
        dados.cep || '',
        `"${(dados.logradouro || '').replace(/"/g, '""')}"`,
        dados.numero || '',
        `"${(dados.complemento || '').replace(/"/g, '""')}"`,
        `"${(dados.bairro || '').replace(/"/g, '""')}"`,
        `"${(dados.cidade || '').replace(/"/g, '""')}"`,
        dados.estado || '',
        dados.ddd || '',
        dados.telefone || '',
        dados.email || '',
        dados.faturamentoMinimo || '',
        dados.dataFiliacao || '',
        dados.status || ''
      ].join(';');
    });
    
    const conteudo = [cabecalho.join(';'), ...linhasCSV].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `erros_importacao_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast(`Log de erros exportado com ${resultado.erros.length} registro(s)!`, 'success');
  };
  
  const handleImportar = async () => {
    if (!arquivo) {
      showToast('Selecione um arquivo para importar', 'error');
      return;
    }
    
    setIsLoading(true);
    setProgresso(0);
    setProgressoAnimado(0);
    setMensagemProgresso('Iniciando importação...');
    setResultado(null);
    
    try {
      console.log('🚀 Iniciando importação do arquivo:', arquivo.name);
      
      // 🔥 CHAMAR SERVIÇO COM PROGRESSO EM TEMPO REAL
      const resultadoImportacao = await associadoImportacaoService.importarAssociados(
        arquivo,
        (progressoAtual, mensagem) => {
          setProgresso(progressoAtual);
          setMensagemProgresso(mensagem);
          console.log(`📊 Progresso: ${progressoAtual}% - ${mensagem}`);
        }
      );
      
      console.log('📊 Resultado da importação (RAW):', resultadoImportacao);
      
      // 🔥 MAPEAR OS DADOS CORRETAMENTE
      const resultadoMapeado: ResultadoImportacao = {
        totalLinhas: resultadoImportacao.totalLinhas || resultadoImportacao.totalProcessados || 0,
        linhasProcessadas: resultadoImportacao.linhasProcessadas || resultadoImportacao.totalProcessados || 0,
        linhasComErro: resultadoImportacao.linhasComErro || resultadoImportacao.totalErros || 0,
        associadosImportados: (resultadoImportacao.criados || 0) + (resultadoImportacao.atualizados || 0),
        criados: resultadoImportacao.criados || 0,
        atualizados: resultadoImportacao.atualizados || 0,
        configuracoesCriadas: resultadoImportacao.configuracoesCriadas || 0,
        erros: resultadoImportacao.erros || []
      };
      
      console.log('📊 Resultado mapeado:', resultadoMapeado);
      
      setResultado(resultadoMapeado);
      setProgresso(100);
      setMensagemProgresso('Importação concluída!');
      
      // 🔥 CALCULAR TAXA DE SUCESSO
      const totalProcessados = (resultadoMapeado.criados || 0) + (resultadoMapeado.atualizados || 0);
      const totalLinhas = resultadoMapeado.totalLinhas || 1;
      const taxaSucesso = Math.round((totalProcessados / totalLinhas) * 100);
      
      // 🔥 MENSAGEM PERSONALIZADA
      if (resultadoMapeado.linhasComErro === 0) {
        if (resultadoMapeado.criados > 0 || resultadoMapeado.atualizados > 0) {
          showToast(
            `${resultadoMapeado.criados} associados criados e ${resultadoMapeado.atualizados} atualizados com sucesso! (${taxaSucesso}% de sucesso)`,
            'success'
          );
        } else {
          showToast(
            `⚠️ Nenhum associado foi importado. Verifique se o arquivo contém dados válidos.`,
            'warning'
          );
        }
      } else {
        if (resultadoMapeado.criados > 0 || resultadoMapeado.atualizados > 0) {
          showToast(
            `${resultadoMapeado.criados} criados, ${resultadoMapeado.atualizados} atualizados, ${resultadoMapeado.linhasComErro} com erro (${taxaSucesso}% de sucesso)`,
            'warning'
          );
        } else {
          showToast(
            `❌ ${resultadoMapeado.linhasComErro} erros encontrados. Nenhum associado foi importado.`,
            'error'
          );
        }
      }
      
    } catch (error: any) {
      console.error('❌ Erro na importação:', error);
      showToast(error.message || 'Erro ao importar associados', 'error');
      setProgresso(0);
      setMensagemProgresso('Erro na importação');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerAssociados = () => {
    navigate('/associados');
  };
  
  const handleLimparArquivo = () => {
    setArquivo(null);
    setResultado(null);
    setProgresso(0);
    setProgressoAnimado(0);
    setMensagemProgresso('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const calcularTaxaSucesso = (resultado: ResultadoImportacao | null): number => {
    if (!resultado || resultado.totalLinhas === 0) return 0;
    const totalProcessados = (resultado.criados || 0) + (resultado.atualizados || 0);
    return Math.round((totalProcessados / resultado.totalLinhas) * 100);
  };
  
  // 🔥 DETERMINAR COR DA TAXA DE SUCESSO
  const getTaxaCor = (taxa: number): string => {
    if (taxa >= 80) return 'text-green-600';
    if (taxa >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getTaxaBg = (taxa: number): string => {
    if (taxa >= 80) return 'bg-green-50';
    if (taxa >= 50) return 'bg-yellow-50';
    return 'bg-red-50';
  };
  
  const getBarraCor = (taxa: number): string => {
    if (taxa >= 80) return 'bg-green-500';
    if (taxa >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb atual="Importação de Associados" />
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Importação de Associados</h1>
          <p className="text-gray-600">
            Importe associados em lote utilizando um arquivo CSV. Baixe o modelo para conhecer o formato esperado.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Área de Upload */}
          <div className="lg:col-span-2">
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                arquivo 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="text-5xl mb-4">📁</div>
              <p className="text-gray-600 mb-2">
                {arquivo ? arquivo.name : 'Arraste o arquivo aqui ou clique para selecionar'}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Formatos aceitos: CSV, TXT (separador: ponto e vírgula)
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
            
            {/* 🔥 BARRA DE PROGRESSO EM TEMPO REAL */}
            {isLoading && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{mensagemProgresso || 'Processando...'}</span>
                  <span className="font-medium text-blue-600">{Math.round(progresso)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressoAnimado}%` }}
                  />
                </div>
                {progresso > 0 && progresso < 100 && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    ⏳ Aguarde, a importação está em andamento...
                  </p>
                )}
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
                onClick={handleImportar}
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
                    🚀 Iniciar Importação
                  </>
                )}
              </button>
              <button
                onClick={handleVerAssociados}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Ver Associados
              </button>
            </div>
          </div>
          
          {/* Instruções */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 mb-4">📋 Instruções</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>1. Baixe o modelo de arquivo</li>
              <li>2. Preencha os dados no formato CSV</li>
              <li>3. Os campos obrigatórios são:</li>
              <ul className="ml-6 mt-2 space-y-1 text-xs">
                <li>• tipo_pessoa (F/J)</li>
                <li>• cnpj_cpf (11 ou 14 dígitos)</li>
                <li>• nome_razao</li>
              </ul>
              <li>4. Status deve ser A (Ativo), I (Inativo) ou S (Suspenso)</li>
              <li>5. Campos opcionais podem ser deixados em branco</li>
              <li>6. O sistema validará os dados antes de importar</li>
              <li>7. Associados com CNPJ/CPF existente serão atualizados</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 Dica: Para vendedores, planos e categorias, utilize os códigos cadastrados no sistema.
              </p>
            </div>
          </div>
        </div>
        
        {/* Resultado da Importação */}
        {resultado && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
              <h2 className="text-lg font-semibold text-gray-800">📊 Resultado da Importação</h2>
              
              {resultado.erros && resultado.erros.length > 0 && (
                <button
                  onClick={handleBaixarLogErros}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2 transition-colors shadow-md"
                >
                  <span>📥</span>
                  Baixar Log de Erros ({resultado.erros.length})
                </button>
              )}
            </div>
            
            {/* 🔥 CARDS DE RESUMO */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{resultado.totalLinhas}</div>
                <div className="text-sm text-gray-600">Total de Linhas</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{resultado.linhasProcessadas}</div>
                <div className="text-sm text-gray-600">Linhas Processadas</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{resultado.linhasComErro}</div>
                <div className="text-sm text-gray-600">Linhas com Erro</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(resultado.criados || 0) + (resultado.atualizados || 0)}
                </div>
                <div className="text-sm text-gray-600">Total Processados</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {resultado.criados || 0} / {resultado.atualizados || 0}
                </div>
                <div className="text-sm text-gray-600">Criados / Atualizados</div>
              </div>
              
              {/* 🔥 TAXA DE SUCESSO */}
              <div className={`p-4 rounded-lg text-center ${getTaxaBg(calcularTaxaSucesso(resultado))}`}>
                <div className={`text-2xl font-bold ${getTaxaCor(calcularTaxaSucesso(resultado))}`}>
                  {calcularTaxaSucesso(resultado)}%
                </div>
                <div className="text-sm text-gray-600">Taxa de Sucesso</div>
              </div>
            </div>

            {/* 🔥 CONFIGURAÇÕES DE FATURAMENTO CRIADAS */}
            {resultado.configuracoesCriadas !== undefined && resultado.configuracoesCriadas > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📋</span>
                  <h3 className="font-semibold text-blue-800">Configurações de Faturamento</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Foram criadas <strong>{resultado.configuracoesCriadas}</strong> configuração(ões) de faturamento 
                  com os valores padrão:
                </p>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <span className="font-medium">Plano ID:</span> 5
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <span className="font-medium">Dia Emissão:</span> 26
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <span className="font-medium">Dia Vencimento:</span> 10
                  </div>
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <span className="font-medium">Valor Default:</span> R$ 85,00
                  </div>
                </div>
              </div>
            )}
            
            {/* 🔥 BARRA DE PROGRESSO VISUAL DO RESULTADO */}
            {resultado.totalLinhas > 0 && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Eficiência da Importação</span>
                  <span className={getTaxaCor(calcularTaxaSucesso(resultado))}>
                    {calcularTaxaSucesso(resultado)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${getBarraCor(calcularTaxaSucesso(resultado))}`}
                    style={{ 
                      width: `${Math.min(calcularTaxaSucesso(resultado), 100)}%` 
                    }}
                  />
                </div>
              </div>
            )}
            
            {/* 🔥 MENSAGENS DE STATUS */}
            {resultado.linhasComErro > 0 && resultado.criados === 0 && resultado.atualizados === 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">❌</span>
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Nenhum associado foi importado
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      {resultado.linhasComErro} erro(s) encontrados. Verifique o arquivo e tente novamente.
                    </p>
                    <button
                      onClick={() => setMostrarErros(true)}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Ver detalhes dos erros
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {resultado.linhasComErro > 0 && (resultado.criados || 0) > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Importação parcialmente concluída
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {resultado.criados} associados criados e {resultado.atualizados} atualizados com sucesso.
                      {resultado.linhasComErro} erro(s) encontrados.
                    </p>
                    <button
                      onClick={() => setMostrarErros(true)}
                      className="mt-2 text-xs text-yellow-600 hover:text-yellow-800 underline"
                    >
                      Ver detalhes dos erros
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {resultado.linhasComErro === 0 && (resultado.criados || 0) > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Importação concluída com sucesso!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      {resultado.criados} associados criados e {resultado.atualizados} atualizados.
                      {resultado.configuracoesCriadas > 0 && ` ${resultado.configuracoesCriadas} configurações de faturamento criadas.`}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 🔥 LISTA DE ERROS */}
            {resultado.erros && resultado.erros.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setMostrarErros(!mostrarErros)}
                  className="flex items-center gap-2 text-red-600 hover:text-red-800 mb-3 font-medium"
                >
                  {mostrarErros ? '▼' : '▶'} Detalhes dos Erros ({resultado.erros.length})
                </button>
                
                {mostrarErros && (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Linha</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Erro</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dados</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {resultado.erros.map((erro, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-center font-mono">{erro.linha}</td>
                            <td className="px-4 py-2 text-red-600">{erro.mensagem}</td>
                            <td className="px-4 py-2">
                              <details>
                                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-xs">
                                  Ver dados
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-40">
                                  {JSON.stringify(erro.dados, null, 2)}
                                </pre>
                              </details>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportacaoAssociados;