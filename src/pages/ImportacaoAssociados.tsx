// src/pages/ImportacaoAssociados.tsx - VERSÃO CDL (alinhada a Associados.tsx)
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { associadoImportacaoService } from '../services/associadoImportacaoService';
import BreadCrumb from '../components/BreadCrumb';
import { useMessage } from '../providers/MessageProvider';
import EmptyState from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

// ==================== TIPOS ====================
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

interface AssociadoInativado {
  id: number;
  cnpjCpf: string;
  nomeRazao: string;
  status: string;
  dataInativacao?: string;
  motivoInativacao?: string;
}

interface ResultadoImportacao {
  totalLinhas: number;
  linhasProcessadas: number;
  linhasComErro: number;
  associadosImportados: number;
  criados?: number;
  atualizados?: number;
  configuracoesCriadas?: number;
  reguasVinculadas?: number;
  inativados?: number;
  associadosInativados?: AssociadoInativado[];
  erros: Array<{ linha: number; mensagem: string; dados: AssociadoImportacaoLinha }>;
}

/* ============================================================
   COMPONENTE: Card de resultado (métrica)
   ============================================================ */
type MetricTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const METRIC_STYLES: Record<MetricTone, { bg: string; border: string; value: string; label: string }> = {
  neutral: { bg: 'bg-cdl-neutral-50',  border: 'border-cdl-neutral-100',  value: 'text-cdl-neutral-700', label: 'text-cdl-neutral-500' },
  info:    { bg: 'bg-cdl-navy-50',     border: 'border-cdl-navy-100',     value: 'text-cdl-navy-700',    label: 'text-cdl-navy-600' },
  success: { bg: 'bg-cdl-green-50',    border: 'border-cdl-green-100',    value: 'text-cdl-green-700',   label: 'text-cdl-green-600' },
  warning: { bg: 'bg-cdl-yellow-50',   border: 'border-cdl-yellow-100',   value: 'text-cdl-yellow-700',  label: 'text-cdl-yellow-600' },
  danger:  { bg: 'bg-cdl-danger-50',   border: 'border-cdl-danger-100',   value: 'text-cdl-danger-500',  label: 'text-cdl-danger-500' },
  accent:  { bg: 'bg-cdl-yellow-50',   border: 'border-cdl-yellow-100',   value: 'text-cdl-yellow-700',  label: 'text-cdl-yellow-600' },
};

const MetricCard: React.FC<{ value: number | string; label: string; tone?: MetricTone; icon?: string }> = ({
  value, label, tone = 'neutral', icon,
}) => {
  const s = METRIC_STYLES[tone];
  return (
    <div className={`${s.bg} ${s.border} border p-4 rounded-lg text-center transition-colors`}>
      <div className={`text-2xl font-bold ${s.value}`}>{value}</div>
      <div className={`text-sm ${s.label} mt-0.5`}>{icon && <span className="mr-1">{icon}</span>}{label}</div>
    </div>
  );
};

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
const ImportacaoAssociados: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useMessage();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemProgresso, setMensagemProgresso] = useState('');
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null);
  const [mostrarErros, setMostrarErros] = useState(false);
  const [mostrarInativados, setMostrarInativados] = useState(false);
  const [progressoAnimado, setProgressoAnimado] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animação do progresso
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

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => e.preventDefault(), []);

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
      'Linha','Erro','Tipo Pessoa','CNPJ/CPF','Nome/Razão Social',
      'Nome Fantasia','Código Vendedor','Código Vendedor Externo',
      'Código Plano','Código Categoria','Código SPC','Código RM',
      'CEP','Logradouro','Número','Complemento','Bairro',
      'Cidade','Estado','DDD','Telefone','Email',
      'Faturamento Mínimo','Data Filiação','Status',
    ];
    const linhasCSV = resultado.erros.map(erro => {
      const d = erro.dados;
      return [
        erro.linha,
        `"${erro.mensagem.replace(/"/g, '""')}"`,
        d.tipoPessoa || '', d.cnpjCpf || '',
        `"${(d.nomeRazao || '').replace(/"/g, '""')}"`,
        `"${(d.nomeFantasia || '').replace(/"/g, '""')}"`,
        d.codigoVendedor || '', d.codigoVendedorExterno || '',
        d.codigoPlano || '', d.codigoCategoria || '',
        d.codigoSpc || '', d.codigoRm || '',
        d.cep || '', `"${(d.logradouro || '').replace(/"/g, '""')}"`,
        d.numero || '', `"${(d.complemento || '').replace(/"/g, '""')}"`,
        `"${(d.bairro || '').replace(/"/g, '""')}"`,
        `"${(d.cidade || '').replace(/"/g, '""')}"`,
        d.estado || '', d.ddd || '', d.telefone || '', d.email || '',
        d.faturamentoMinimo || '', d.dataFiliacao || '', d.status || '',
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
      const resultadoImportacao = await associadoImportacaoService.importarAssociados(
        arquivo,
        (progressoAtual, mensagem) => {
          setProgresso(progressoAtual);
          setMensagemProgresso(mensagem);
        }
      );
      const resultadoMapeado: ResultadoImportacao = {
        totalLinhas: resultadoImportacao.totalLinhas || 0,
        linhasProcessadas: resultadoImportacao.linhasProcessadas || 0,
        linhasComErro: resultadoImportacao.linhasComErro || 0,
        associadosImportados: (resultadoImportacao.criados || 0) + (resultadoImportacao.atualizados || 0),
        criados: resultadoImportacao.criados || 0,
        atualizados: resultadoImportacao.atualizados || 0,
        configuracoesCriadas: resultadoImportacao.configuracoesCriadas || 0,
        reguasVinculadas: resultadoImportacao.reguasVinculadas || 0,
        inativados: resultadoImportacao.inativados || 0,
        associadosInativados: resultadoImportacao.associadosInativados || [],
        erros: resultadoImportacao.erros || [],
      };
      setResultado(resultadoMapeado);
      setProgresso(100);
      setMensagemProgresso('Importação concluída!');

      const totalProcessados = (resultadoMapeado.criados || 0) + (resultadoMapeado.atualizados || 0);
      const totalLinhas = resultadoMapeado.totalLinhas || 1;
      const taxaSucesso = Math.round((totalProcessados / totalLinhas) * 100);

      let mensagem = '';
      if (resultadoMapeado.inativados && resultadoMapeado.inativados > 0) {
        mensagem = `✅ ${resultadoMapeado.criados} criados, ${resultadoMapeado.atualizados} atualizados, 🔴 ${resultadoMapeado.inativados} inativados (${taxaSucesso}% de sucesso)`;
        showToast(mensagem, 'warning');
      } else if (resultadoMapeado.linhasComErro === 0) {
        if (resultadoMapeado.criados > 0 || resultadoMapeado.atualizados > 0) {
          mensagem = `✅ ${resultadoMapeado.criados} criados, ${resultadoMapeado.atualizados} atualizados com sucesso! (${taxaSucesso}% de sucesso)`;
          showToast(mensagem, 'success');
        } else {
          showToast(`⚠️ Nenhum associado foi importado. Verifique se o arquivo contém dados válidos.`, 'warning');
        }
      } else {
        if (resultadoMapeado.criados > 0 || resultadoMapeado.atualizados > 0) {
          mensagem = `⚠️ ${resultadoMapeado.criados} criados, ${resultadoMapeado.atualizados} atualizados, ${resultadoMapeado.linhasComErro} com erro (${taxaSucesso}% de sucesso)`;
          showToast(mensagem, 'warning');
        } else {
          mensagem = `❌ ${resultadoMapeado.linhasComErro} erros encontrados. Nenhum associado foi importado.`;
          showToast(mensagem, 'error');
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

  const handleVerAssociados = () => navigate('/associados');

  const handleLimparArquivo = () => {
    setArquivo(null);
    setResultado(null);
    setProgresso(0);
    setProgressoAnimado(0);
    setMensagemProgresso('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const calcularTaxaSucesso = (r: ResultadoImportacao | null): number => {
    if (!r || r.totalLinhas === 0) return 0;
    return Math.round((((r.criados || 0) + (r.atualizados || 0)) / r.totalLinhas) * 100);
  };

  /* --- Taxa: classes CDL --- */
  const getTaxaCor = (t: number) =>
    t >= 80 ? 'text-cdl-green-700' : t >= 50 ? 'text-cdl-yellow-700' : 'text-cdl-danger-500';
  const getTaxaBg = (t: number) =>
    t >= 80 ? 'bg-cdl-green-50 border-cdl-green-100'
    : t >= 50 ? 'bg-cdl-yellow-50 border-cdl-yellow-100'
    : 'bg-cdl-danger-50 border-cdl-danger-100';
  const getBarraCor = (t: number) =>
    t >= 80 ? 'bg-cdl-green-500' : t >= 50 ? 'bg-cdl-yellow-500' : 'bg-cdl-danger-500';

  const taxa = resultado ? calcularTaxaSucesso(resultado) : 0;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="p-6">
      <BreadCrumb atual="Importação de Associados" />

      {/* ===== Cabeçalho ===== */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cdl-navy-700">Importação de Associados</h1>
          <p className="text-gray-600">
            Importe associados em lote utilizando um arquivo CSV. Baixe o modelo para conhecer o formato esperado.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadModelo}
            disabled={isLoading}
            className="px-4 py-2 bg-cdl-neutral-50 text-cdl-navy-700 border border-[#E2E6EC]
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-50
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            📥 Baixar Modelo
          </button>
          <button
            onClick={handleVerAssociados}
            className="px-4 py-2 bg-cdl-navy-50 text-cdl-navy-700 border border-cdl-navy-100
                       rounded-lg flex items-center gap-2 hover:bg-cdl-navy-100 transition-colors"
          >
            👥 Ver Associados
          </button>
        </div>
      </div>

      {/* ===== Container principal ===== */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ==================== ÁREA DE UPLOAD ==================== */}
            <div className="lg:col-span-2">
              {!arquivo ? (
                <div
                  className="border-2 border-dashed border-gray-300 hover:border-cdl-navy-400
                             hover:bg-cdl-navy-50 rounded-xl transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <EmptyState
                    icon="📁"
                    title="Arraste o arquivo aqui ou clique para selecionar"
                    description="Formatos aceitos: CSV ou TXT (separador: ponto e vírgula)"
                    action={
                      <label
                        htmlFor="file-upload"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex px-6 py-3 bg-cdl-navy-700 text-white rounded-lg
                                   hover:bg-cdl-navy-800 cursor-pointer transition-all
                                   active:scale-[.98] font-medium"
                      >
                        Selecionar Arquivo
                      </label>
                    }
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-cdl-green-400 bg-cdl-green-50
                                rounded-xl p-8 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-cdl-green-700 font-medium mb-1">Arquivo pronto para importar</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Formatos aceitos: CSV, TXT (separador: ponto e vírgula)
                  </p>
                  <label
                    htmlFor="file-upload"
                    className="inline-flex px-5 py-2.5 bg-cdl-navy-700 text-white rounded-lg
                               hover:bg-cdl-navy-800 cursor-pointer transition-all
                               active:scale-[.98] font-medium text-sm"
                  >
                    Trocar Arquivo
                  </label>
                </div>
              )}

              {/* Input escondido */}
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
                      <div className="text-xs text-gray-500">
                        {(arquivo.size / 1024).toFixed(2)} KB
                      </div>
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
                      {mensagemProgresso || 'Processando...'}
                    </span>
                    <span className="font-semibold">{Math.round(progresso)}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-cdl-navy-100">
                    <div
                      className="bg-cdl-yellow-gradient h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${progressoAnimado}%` }}
                    />
                  </div>
                  {progresso > 0 && progresso < 100 && (
                    <p className="text-xs text-cdl-navy-600 mt-2 text-center">
                      ⏳ Aguarde, a importação está em andamento...
                    </p>
                  )}
                </div>
              )}

              {/* Botões de ação */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleImportar}
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
                    <>🚀 Iniciar Importação</>
                  )}
                </button>
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
                <li>8. 🔥 Associados ATIVOS que não estiverem no arquivo serão INATIVADOS</li>
                <li>9. 📏 Novos associados são vinculados automaticamente à régua padrão</li>
              </ul>
              <div className="mt-4 p-3 bg-cdl-yellow-50 border border-cdl-yellow-100 rounded-lg">
                <p className="text-xs text-cdl-yellow-700">
                  💡 <strong>Dica:</strong> Para vendedores, planos e categorias, utilize os códigos cadastrados no sistema.
                </p>
              </div>
            </div>
          </div>

          {/* ==================== SKELETON DURANTE PROCESSAMENTO ==================== */}
          {isLoading && !resultado && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <Skeleton className="h-6 w-56 mb-6" />
              <div className="grid grid-cols-2 md:grid-cols-8 gap-4 mb-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-3 w-full mb-6" />
            </div>
          )}

          {/* ==================== RESULTADO ==================== */}
          {resultado && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              {/* Cabeçalho com botão de log */}
              <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
                <h2 className="text-lg font-semibold text-cdl-navy-700 flex items-center gap-2">
                  <span>📊</span> Resultado da Importação
                </h2>
                {resultado.erros && resultado.erros.length > 0 && (
                  <button
                    onClick={handleBaixarLogErros}
                    className="px-4 py-2 bg-cdl-danger-500 text-white rounded-lg
                               hover:bg-cdl-danger-600 flex items-center gap-2
                               transition-all active:scale-[.98] font-medium shadow-sm"
                  >
                    <span>📥</span>
                    Baixar Log de Erros ({resultado.erros.length})
                  </button>
                )}
              </div>

              {/* Cards de métricas principais */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 mb-6">
                <MetricCard value={resultado.totalLinhas || 0}         label="Total Linhas"      tone="neutral" icon="📄" />
                <MetricCard value={resultado.linhasProcessadas || 0}   label="Processadas"       tone="info"    icon="⚙️" />
                <MetricCard value={resultado.criados || 0}             label="Criados"           tone="success" icon="✅" />
                <MetricCard value={resultado.atualizados || 0}         label="Atualizados"       tone="warning" icon="✏️" />
                <MetricCard value={resultado.inativados || 0}          label="Inativados"        tone="danger"  icon="🔴" />
                <MetricCard value={resultado.linhasComErro || 0}       label="Erros"             tone="danger"  icon="❌" />
                <MetricCard value={resultado.configuracoesCriadas || 0} label="Configurações"     tone="info"    icon="⚙️" />
                <MetricCard value={resultado.reguasVinculadas || 0}    label="Réguas"            tone="accent"  icon="📏" />
              </div>

              {/* Totais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-cdl-navy-50 border border-cdl-navy-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-cdl-navy-700">
                    {(resultado.criados || 0) + (resultado.atualizados || 0)}
                  </div>
                  <div className="text-sm text-cdl-navy-600">Total Processados</div>
                </div>
                <div className={`border p-4 rounded-lg text-center ${getTaxaBg(taxa)}`}>
                  <div className={`text-2xl font-bold ${getTaxaCor(taxa)}`}>{taxa}%</div>
                  <div className="text-sm text-gray-600">🎯 Taxa de Sucesso</div>
                </div>
                <div className="bg-cdl-yellow-50 border border-cdl-yellow-100 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-cdl-yellow-700">
                    {(resultado.criados || 0) > 0 ? '✨ Nova' : '📋 Existente'}
                  </div>
                  <div className="text-sm text-cdl-yellow-600">Status da Importação</div>
                </div>
              </div>

              {/* Info: configurações criadas */}
              {resultado.configuracoesCriadas !== undefined && resultado.configuracoesCriadas > 0 && (
                <div className="mt-4 p-4 bg-cdl-navy-50 rounded-lg border border-cdl-navy-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📋</span>
                    <h3 className="font-semibold text-cdl-navy-700">Configurações de Faturamento</h3>
                  </div>
                  <p className="text-sm text-cdl-navy-700">
                    Foram criadas <strong>{resultado.configuracoesCriadas}</strong> configuração(ões) de faturamento com os valores padrão:
                  </p>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {[
                      ['Plano ID', '5'],
                      ['Dia Emissão', '26'],
                      ['Dia Vencimento', '10'],
                      ['Valor Default', 'R$ 85,00'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-white p-2 rounded border border-cdl-navy-100">
                        <span className="font-medium text-cdl-navy-700">{k}:</span> <span className="text-gray-700">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info: réguas vinculadas */}
              {resultado.reguasVinculadas !== undefined && resultado.reguasVinculadas > 0 && (
                <div className="mt-4 p-4 bg-cdl-yellow-50 rounded-lg border border-cdl-yellow-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📏</span>
                    <h3 className="font-semibold text-cdl-yellow-700">Régua de Faturamento Padrão</h3>
                  </div>
                  <p className="text-sm text-cdl-yellow-700">
                    <strong>{resultado.reguasVinculadas}</strong> associado(s) foram vinculados automaticamente à régua padrão de faturamento <strong>(Consolidado - id=6)</strong>.
                  </p>
                  <p className="text-xs text-cdl-yellow-600 mt-1">
                    ℹ️ Apenas novos associados ou existentes que estavam sem régua foram vinculados. Réguas já definidas foram preservadas.
                  </p>
                </div>
              )}

              {/* Barra de eficiência */}
              {resultado.totalLinhas > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>📈 Eficiência da Importação</span>
                    <span className={`font-semibold ${getTaxaCor(taxa)}`}>{taxa}%</span>
                  </div>
                  <div className="w-full bg-cdl-neutral-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${getBarraCor(taxa)}`}
                      style={{ width: `${Math.min(taxa, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Mensagem: erro total */}
              {resultado.linhasComErro > 0 && resultado.criados === 0 && resultado.atualizados === 0 && (
                <div className="mt-4 p-4 bg-cdl-danger-50 rounded-lg border border-cdl-danger-100">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">❌</span>
                    <div>
                      <p className="text-sm font-medium text-cdl-danger-600">Nenhum associado foi importado</p>
                      <p className="text-xs text-cdl-danger-500 mt-1">
                        {resultado.linhasComErro} erro(s) encontrados. Verifique o arquivo e tente novamente.
                      </p>
                      <button
                        onClick={() => setMostrarErros(true)}
                        className="mt-2 text-xs text-cdl-danger-600 hover:text-cdl-danger-500 underline"
                      >
                        Ver detalhes dos erros
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem: parcial */}
              {resultado.linhasComErro > 0 && ((resultado.criados || 0) > 0 || (resultado.atualizados || 0) > 0) && (
                <div className="mt-4 p-4 bg-cdl-yellow-50 rounded-lg border border-cdl-yellow-100">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-cdl-yellow-700">Importação parcialmente concluída</p>
                      <p className="text-xs text-cdl-yellow-600 mt-1">
                        {resultado.criados} associados criados e {resultado.atualizados} atualizados com sucesso. {resultado.linhasComErro} erro(s) encontrados.
                      </p>
                      <button
                        onClick={() => setMostrarErros(true)}
                        className="mt-2 text-xs text-cdl-yellow-700 hover:text-cdl-yellow-600 underline"
                      >
                        Ver detalhes dos erros
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensagem: sucesso */}
              {resultado.linhasComErro === 0 && ((resultado.criados || 0) > 0 || (resultado.atualizados || 0) > 0) && (
                <div className="mt-4 p-4 bg-cdl-green-50 rounded-lg border border-cdl-green-100">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                      <p className="text-sm font-medium text-cdl-green-700">Importação concluída com sucesso!</p>
                      <p className="text-xs text-cdl-green-600 mt-1">
                        {resultado.criados} associados criados e {resultado.atualizados} atualizados.
                        {resultado.configuracoesCriadas > 0 && ` ${resultado.configuracoesCriadas} configurações de faturamento criadas.`}
                        {resultado.reguasVinculadas !== undefined && resultado.reguasVinculadas > 0 && ` 📏 ${resultado.reguasVinculadas} vinculados à régua padrão.`}
                        {resultado.inativados && resultado.inativados > 0 && ` ${resultado.inativados} associados inativados automaticamente.`}
                      </p>
                      <p className="text-xs text-cdl-green-600 mt-1">
                        🎯 Taxa de sucesso: <strong>{taxa}%</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de erros */}
              {resultado.erros && resultado.erros.length > 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setMostrarErros(!mostrarErros)}
                    className="flex items-center gap-2 text-cdl-danger-500 hover:text-cdl-danger-600
                               mb-3 font-medium transition-colors"
                  >
                    {mostrarErros ? '▼' : '▶'} Detalhes dos Erros ({resultado.erros.length})
                  </button>

                  {mostrarErros && (
                    <div className="overflow-x-auto border border-cdl-danger-100 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-cdl-danger-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-cdl-danger-500 uppercase tracking-wider">Linha</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-cdl-danger-500 uppercase tracking-wider">Erro</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-cdl-danger-500 uppercase tracking-wider">Dados</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {resultado.erros.map((erro, idx) => (
                            <tr key={idx} className="hover:bg-cdl-danger-50/40 transition-colors">
                              <td className="px-4 py-2 text-center font-mono text-cdl-navy-700">{erro.linha}</td>
                              <td className="px-4 py-2 text-cdl-danger-500">{erro.mensagem}</td>
                              <td className="px-4 py-2">
                                <details>
                                  <summary className="cursor-pointer text-cdl-navy-700 hover:text-cdl-navy-800 text-xs">
                                    Ver dados
                                  </summary>
                                  <pre className="mt-2 text-xs bg-cdl-neutral-50 p-2 rounded overflow-x-auto max-h-40 border border-cdl-neutral-100">
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

              {/* Lista de inativados */}
              {resultado.inativados && resultado.inativados > 0 && resultado.associadosInativados && (
                <div className="mt-6">
                  <button
                    onClick={() => setMostrarInativados(!mostrarInativados)}
                    className="flex items-center gap-2 text-cdl-danger-500 hover:text-cdl-danger-600
                               mb-3 font-medium transition-colors"
                  >
                    {mostrarInativados ? '▼' : '▶'} Associados Inativados ({resultado.inativados})
                  </button>

                  {mostrarInativados && (
                    <div className="overflow-x-auto border border-cdl-danger-100 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-cdl-danger-50">
                          <tr>
                            {['CNPJ/CPF','Nome/Razão','Status','Data Inativação','Motivo'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-cdl-danger-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {resultado.associadosInativados.map((associado) => (
                            <tr key={associado.id} className="hover:bg-cdl-danger-50/40 transition-colors">
                              <td className="px-4 py-2 font-mono text-sm text-cdl-navy-700">{associado.cnpjCpf}</td>
                              <td className="px-4 py-2 max-w-xs truncate" title={associado.nomeRazao}>
                                {associado.nomeRazao}
                              </td>
                              <td className="px-4 py-2">
                                <span className="px-2 py-1 bg-cdl-danger-50 text-cdl-danger-500 rounded-full text-xs font-medium">
                                  INATIVO
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {associado.dataInativacao
                                  ? new Date(associado.dataInativacao).toLocaleDateString('pt-BR')
                                  : '-'}
                              </td>
                              <td className="px-4 py-2 text-xs text-gray-600 max-w-xs truncate" title={associado.motivoInativacao}>
                                {associado.motivoInativacao || 'INATIVAÇÃO PROCESSAMENTO AUTOMATICO'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Mensagem de inativação automática */}
              {resultado.inativados && resultado.inativados > 0 && (
                <div className="mt-4 p-4 bg-cdl-danger-50 rounded-lg border border-cdl-danger-100">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <p className="text-sm font-medium text-cdl-danger-600">
                        {resultado.inativados} associados foram inativados automaticamente
                      </p>
                      <p className="text-xs text-cdl-danger-500 mt-1">
                        Motivo: <strong>INATIVAÇÃO PROCESSAMENTO AUTOMATICO</strong>
                      </p>
                      <p className="text-xs text-cdl-danger-500 mt-1">
                        Estes associados estavam com status <strong>ATIVO</strong> no sistema, mas não foram encontrados no arquivo importado.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportacaoAssociados;