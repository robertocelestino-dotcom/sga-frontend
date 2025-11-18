import React, { useState } from 'react';
import { importacaoSPCService } from '../services/api'; // CORREÇÃO: use importacaoSPCService

interface ProcessamentoDetalhes {
  id?: string;
  status?: string;
  totalRegistros?: number;
  registrosProcessados?: number;
  registrosComErro?: number;
  valorTotal?: number;
  dataProcessamento?: string;
  mensagem?: string;
  [key: string]: any;
}

const handleUpload = async () => {
  
  if (!file) {
    setError('Por favor, selecione um arquivo primeiro.');
    return;
  }

  setIsLoading(true);
  setError(null);
  setSuccess(null);
  setProcessamentoDetalhes(null);

  try {
    console.log('🔍 Testando conexão com backend...');
    
    // Teste do health check primeiro
    try {
      const healthResponse = await api.get('/importacao-spc/health');
      console.log('✅ Health check do backend:', healthResponse.data);
    } catch (healthError) {
      console.error('❌ Health check falhou:', healthError);
      setError('Backend não está respondendo. Verifique se o servidor está rodando.');
      setIsLoading(false);
      return;
    }

    console.log('📤 Iniciando upload do arquivo:', file.name);
    const response = await importacaoSPCService.uploadArquivo(file);
    console.log('✅ Resposta da API:', response);

    // Processar resposta
    const detalhes: ProcessamentoDetalhes = {
      id: response.importacao?.id,
      status: response.importacao?.status || 'PROCESSADO',
      totalRegistros: response.importacao?.quantidadeItens,
      registrosProcessados: response.importacao?.quantidadeItensProcessados,
      valorTotal: response.importacao?.valorTotal,
      dataProcessamento: response.importacao?.dataImportacao,
      mensagem: response.mensagem || 'Arquivo importado com sucesso!',
      respostaCompleta: response
    };

    setProcessamentoDetalhes(detalhes);
    setSuccess(detalhes.mensagem);
    setFile(null);
    
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
  } catch (error: any) {
    console.error('❌ Erro detalhado no upload:', error);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Dados:', error.response.data);
      console.error('🔧 Headers:', error.response.headers);
      
      if (error.response.status === 500) {
        const errorMsg = error.response.data?.erro || error.response.data?.message || 'Erro interno no servidor';
        setError(`Erro no processamento: ${errorMsg}`);
      } else if (error.response.status === 400) {
        setError(error.response.data?.erro || 'Erro na requisição');
      }
    } else if (error.code === 'ERR_NETWORK') {
      setError('Erro de conexão. Verifique se o backend está rodando.');
    } else {
      setError('Erro ao importar arquivo: ' + (error.message || 'Erro desconhecido'));
    }
  } finally {
    setIsLoading(false);
  }
};

const ImportacaoSPC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processamentoDetalhes, setProcessamentoDetalhes] = useState<ProcessamentoDetalhes | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Verificar se é um arquivo TXT
      const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'));
      
      if (fileExtension === '.txt') {
        setFile(selectedFile);
        setError(null);
        setSuccess(null);
        setProcessamentoDetalhes(null);
        
        // Validação de tamanho - 100MB como máximo
        if (selectedFile.size > 100 * 1024 * 1024) {
          setError('Arquivo muito grande. Tamanho máximo permitido: 100MB');
          setFile(null);
          event.target.value = '';
          return;
        }

        // Validação do nome do arquivo - formato 5501txtp.txt
        const fileName = selectedFile.name.toLowerCase();
        if (!fileName.match(/^\d+txtp\.txt$/)) {
          setError('Nome do arquivo deve seguir o formato: NÚMEROStxtp.txt (ex: 5501txtp.txt)');
          setFile(null);
          event.target.value = '';
          return;
        }
      } else {
        setError('Por favor, selecione um arquivo TXT (.txt).');
        event.target.value = '';
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo primeiro.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setProcessamentoDetalhes(null);

    try {
      // Upload REAL para a API - CORREÇÃO: use importacaoSPCService.uploadArquivo
      console.log('Iniciando upload do arquivo:', file.name);
      const response = await importacaoSPCService.uploadArquivo(file); // CORREÇÃO
      console.log('Resposta da API:', response);

      // Processar resposta REAL da API
      const detalhes: ProcessamentoDetalhes = {
        // Use os campos que sua API realmente retorna do importacaoSPCService
        id: response.importacao?.id || response.id,
        status: response.importacao?.status || response.status || 'PROCESSADO',
        totalRegistros: response.importacao?.quantidadeItens || response.quantidadeItens || response.totalRegistros,
        registrosProcessados: response.importacao?.quantidadeItensProcessados || response.quantidadeItensProcessados || response.registrosProcessados,
        registrosComErro: response.registrosComErro || response.erros || response.falhas,
        valorTotal: response.importacao?.valorTotal || response.valorTotal,
        dataProcessamento: response.importacao?.dataImportacao || response.dataImportacao || new Date().toISOString(),
        mensagem: response.mensagem || response.message || 'Arquivo importado com sucesso!',
        // Incluir toda a resposta para debug
        respostaCompleta: response
      };

      setProcessamentoDetalhes(detalhes);
      
      // Mensagem de sucesso baseada na resposta
      const mensagemSucesso = detalhes.mensagem || 'Arquivo importado com sucesso!';
      setSuccess(mensagemSucesso);
      
      // Limpar arquivo após sucesso
      setFile(null);
      
      // Limpar input file
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error: any) {
      console.error('Erro REAL no upload:', error);
      
      // Tratamento REAL de erros da API
      if (error.response) {
        // Erro com resposta do servidor
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 413:
            setError('Arquivo muito grande. Tamanho máximo permitido: 100MB');
            break;
          case 415:
            setError('Formato de arquivo não suportado. Use apenas arquivos TXT.');
            break;
          case 400:
            // Tentar extrair mensagem de erro da resposta
            const errorMessage = data?.message || data?.error || data?.mensagem || 
                                'Arquivo inválido. Verifique o formato e estrutura do arquivo.';
            setError(errorMessage);
            break;
          case 401:
            setError('Sessão expirada. Faça login novamente.');
            break;
          case 500:
            setError('Erro interno do servidor. Tente novamente mais tarde.');
            break;
          default:
            setError(`Erro ${status}: ${data?.message || 'Erro desconhecido'}`);
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        setError('Erro de conexão. Verifique se o servidor está online em http://localhost:8080');
      } else if (error.code === 'ECONNABORTED') {
        setError('Tempo limite excedido. O arquivo pode ser muito grande.');
      } else {
        setError('Erro ao importar arquivo. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const fileExtension = droppedFile.name.toLowerCase().slice(droppedFile.name.lastIndexOf('.'));
      
      if (fileExtension === '.txt') {
        if (droppedFile.size > 100 * 1024 * 1024) {
          setError('Arquivo muito grande. Tamanho máximo permitido: 100MB');
          return;
        }

        // Validar nome do arquivo
        const fileName = droppedFile.name.toLowerCase();
        if (!fileName.match(/^\d+txtp\.txt$/)) {
          setError('Nome do arquivo deve seguir o formato: NÚMEROStxtp.txt (ex: 5501txtp.txt)');
          return;
        }

        setFile(droppedFile);
        setError(null);
        setSuccess(null);
        setProcessamentoDetalhes(null);
      } else {
        setError('Por favor, solte um arquivo TXT (.txt).');
      }
    }
  };

  const handleLimpar = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setProcessamentoDetalhes(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'text-gray-600 bg-gray-100';
    
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'PROCESSADO':
      case 'SUCESSO':
      case 'CONCLUIDO':
      case 'SUCCESS':
        return 'text-green-600 bg-green-100';
      case 'PROCESSANDO':
      case 'EM_ANDAMENTO':
      case 'PROCESSING':
        return 'text-blue-600 bg-blue-100';
      case 'ERRO':
      case 'FALHA':
      case 'ERROR':
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'PENDENTE':
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Cabeçalho */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Importação SPC - Faturamento
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Importe arquivos TXT do SPC para processamento de faturamento
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Área Principal - Upload */}
        <div className="xl:col-span-2 space-y-6">
          {/* Card de Upload */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700">
                Upload do Arquivo SPC
              </h2>
              {file && (
                <button
                  onClick={handleLimpar}
                  className="text-sm text-red-600 hover:text-red-800 font-medium self-end sm:self-auto"
                  disabled={isLoading}
                >
                  Limpar
                </button>
              )}
            </div>
            
            {/* Mensagens de Status */}
            {error && (
              <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-red-500 text-lg">⚠️</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-red-800">
                      Erro no Processamento
                    </h3>
                    <div className="mt-1 text-sm text-red-700">
                      {error}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-green-500 text-lg">✅</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      Processamento Concluído
                    </h3>
                    <div className="mt-1 text-sm text-green-700">
                      {success}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Área de Drag & Drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200 ${
                file 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              onDragOver={handleDragOver}
              onDrop={isLoading ? undefined : handleDrop}
            >
              <div className="text-gray-500 mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl">📄</span>
              </div>
              
              {file ? (
                <div className="text-green-700">
                  <p className="font-semibold text-base sm:text-lg mb-2">Arquivo Selecionado</p>
                  <p className="text-sm mb-3 font-medium break-words">{file.name}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Tamanho: {(file.size / 1024).toFixed(2)} KB</p>
                    <p>Tipo: {file.type || 'text/plain'}</p>
                    <p>Modificado: {new Date(file.lastModified).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 font-medium mb-2 text-sm sm:text-base">
                    Arraste e solte o arquivo SPC aqui
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    ou clique para selecionar
                  </p>
                  <div className="text-xs text-gray-400 space-y-1 mb-3 sm:mb-4">
                    <p>Formato: .TXT (5501txtp.txt)</p>
                    <p>Tamanho máximo: 100MB</p>
                    <p>Formato específico SPC</p>
                  </div>
                </>
              )}

              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".txt"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                    : 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                }`}
              >
                <span className="mr-2">📁</span>
                {file ? 'Trocar Arquivo' : 'Selecionar Arquivo'}
              </label>
            </div>

            {/* Detalhes do Processamento REAL */}
            {processamentoDetalhes && (
              <div className="mt-4 sm:mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-800">Detalhes do Processamento</h4>
                  {processamentoDetalhes.status && (
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(processamentoDetalhes.status)}`}>
                      {processamentoDetalhes.status}
                    </span>
                  )}
                </div>
                
                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  {processamentoDetalhes.totalRegistros !== undefined && (
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-blue-600">
                        {processamentoDetalhes.totalRegistros}
                      </div>
                      <div className="text-blue-700 text-xs">Total Registros</div>
                    </div>
                  )}
                  
                  {processamentoDetalhes.registrosProcessados !== undefined && (
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-green-600">
                        {processamentoDetalhes.registrosProcessados}
                      </div>
                      <div className="text-green-700 text-xs">Processados</div>
                    </div>
                  )}
                  
                  {processamentoDetalhes.registrosComErro !== undefined && (
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-red-600">
                        {processamentoDetalhes.registrosComErro}
                      </div>
                      <div className="text-red-700 text-xs">Com Erro</div>
                    </div>
                  )}
                  
                  {processamentoDetalhes.valorTotal !== undefined && (
                    <div className="text-center">
                      <div className="text-lg sm:text-xl font-bold text-purple-600">
                        R$ {processamentoDetalhes.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-purple-700 text-xs">Valor Total</div>
                    </div>
                  )}
                </div>

                {/* Informações adicionais */}
                {(processamentoDetalhes.id || processamentoDetalhes.dataProcessamento) && (
                  <div className="border-t pt-2 mt-2">
                    {processamentoDetalhes.id && (
                      <div className="text-xs text-gray-600">
                        <strong>ID:</strong> {processamentoDetalhes.id}
                      </div>
                    )}
                    {processamentoDetalhes.dataProcessamento && (
                      <div className="text-xs text-gray-600">
                        <strong>Data:</strong> {new Date(processamentoDetalhes.dataProcessamento).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botão de Ação */}
            <div className="mt-4 sm:mt-6">
              <button
                onClick={handleUpload}
                disabled={!file || isLoading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center text-sm sm:text-base ${
                  !file || isLoading
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🚀</span>
                    Iniciar Importação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Painel Lateral */}
        <div className="space-y-4 sm:space-y-6">
          {/* Informações do Arquivo */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center">
              <span className="mr-2">📋</span>
              Especificações SPC
            </h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-600">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <div><strong>Formato:</strong> .TXT (5501txtp.txt)</div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <div><strong>Nome:</strong> 5501txtp.txt</div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <div><strong>Tamanho:</strong> Máx. 100MB</div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <div><strong>Formato:</strong> Layout SPC oficial</div>
              </div>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              Instruções
            </h3>
            <ul className="text-xs sm:text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Exporte do sistema SPC como TXT
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Nomeie como 5501txtp.txt
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Arraste ou selecione o arquivo
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                Aguarde o processamento REAL
              </li>
            </ul>
          </div>

          {/* Status do Sistema */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <span className="mr-2">🔧</span>
              Status do Sistema
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600 text-xs sm:text-sm">API SPC</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600 text-xs sm:text-sm">Backend</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600 text-xs sm:text-sm">Banco de Dados</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportacaoSPC;