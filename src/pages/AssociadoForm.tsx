import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  associadoService, 
  AssociadoDTO, 
  EnderecoDTO, 
  EmailDTO, 
  TelefoneDTO,
  CategoriaResumoDTO,
  PlanoResumoDTO
} from '../services/associadoService';
import { vendedorService, VendedorResumoDTO } from '../services/vendedorService';
import { produtoService, ProdutoResumoDTO } from '../services/produtoService';
import { useCEP } from '../hooks/useCEP';

// IMPORTS PARA PRODUTOS
import { associadoProdutoService } from '../services/associadoProdutoService';
import { tipoEnvioService } from '../services/tipoEnvioService';
import ModalConfigurarProduto from '../components/ModalConfigurarProduto';
import { ConfiguracaoProduto } from '../types/associadoProduto.types';

// IMPORTS PARA FATURAMENTO
import { associadoDefFaturamentoService } from '../services/associadoDefFaturamentoService';
import ModalConfigurarFaturamento from '../components/ModalConfigurarFaturamento';
import { ConfiguracaoFaturamento, AssociadoDefFaturamentoResumo } from '../types/associadoDefFaturamento.types';

// ==================== UTILITÁRIOS PARA CNPJ ALFANUMÉRICO ====================

/**
 * Converte um caractere para seu valor base para cálculo do DV
 * Conforme especificação da Receita Federal: valor ASCII - 48
 * Ex: 'A' (ASCII 65) -> 65 - 48 = 17
 */
const converterCaractereParaValor = (char: string): number => {
  if (!char) return 0;
  
  // Se for número, retorna o próprio número
  if (/^\d$/.test(char)) {
    return parseInt(char, 10);
  }
  
  // Se for letra, converte para maiúsculo e calcula: ASCII - 48
  const charUpper = char.toUpperCase();
  const asciiCode = charUpper.charCodeAt(0);
  return asciiCode - 48;
};

/**
 * Calcula o dígito verificador para CNPJ alfanumérico (módulo 11)
 * @param base - Os 12 primeiros caracteres do CNPJ (raiz + ordem)
 * @returns O dígito verificador calculado
 */
const calcularDigitoVerificador = (base: string): string => {
  // Pesos para cálculo do primeiro dígito (posições 1-12)
  const pesosPrimeiroDigito = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    const valor = converterCaractereParaValor(base[i]);
    soma += valor * pesosPrimeiroDigito[i];
  }
  
  const resto = soma % 11;
  const primeiroDigito = resto < 2 ? 0 : 11 - resto;
  
  // Para o segundo dígito, incluímos o primeiro dígito no cálculo
  const baseComPrimeiroDigito = base + primeiroDigito.toString();
  const pesosSegundoDigito = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  soma = 0;
  for (let i = 0; i < baseComPrimeiroDigito.length; i++) {
    const valor = converterCaractereParaValor(baseComPrimeiroDigito[i]);
    soma += valor * pesosSegundoDigito[i];
  }
  
  const restoSegundo = soma % 11;
  const segundoDigito = restoSegundo < 2 ? 0 : 11 - restoSegundo;
  
  return `${primeiroDigito}${segundoDigito}`;
};

/**
 * Valida um CNPJ (numérico ou alfanumérico)
 * @param cnpj - CNPJ completo (com ou sem formatação)
 * @returns true se válido, false caso contrário
 */
const validarCnpj = (cnpj: string): boolean => {
  const cnpjLimpo = cnpj.replace(/[^\w]/g, '').toUpperCase();
  
  if (cnpjLimpo.length !== 14) return false;
  
  // Verificar se todos os caracteres são iguais (CNPJ inválido)
  if (/^(\w)\1+$/.test(cnpjLimpo)) return false;
  
  // Se for composto apenas por números, validar como CNPJ antigo
  if (/^\d+$/.test(cnpjLimpo)) {
    return validarCnpjNumerico(cnpjLimpo);
  }
  
  // Validar novo formato alfanumérico
  const base = cnpjLimpo.substring(0, 12);
  const dvInformado = cnpjLimpo.substring(12, 14);
  const dvCalculado = calcularDigitoVerificador(base);
  
  return dvInformado === dvCalculado;
};

/**
 * Valida CNPJ numérico (formato tradicional)
 */
const validarCnpjNumerico = (cnpj: string): boolean => {
  // Implementação da validação tradicional do CNPJ
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
  
  if (cnpjLimpo.length !== 14) return false;
  
  // Elimina CNPJs invalidos conhecidos
  if (/^(\d)\1+$/.test(cnpjLimpo)) return false;
  
  // Valida primeiro dígito verificador
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;
  
  // Valida segundo dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  return resultado === parseInt(digitos.charAt(1));
};

/**
 * Formata CNPJ para exibição (suporta formato alfanumérico)
 */
const formatarCnpjParaExibicao = (cnpj: string): string => {
  const cnpjLimpo = cnpj.replace(/[^\w]/g, '').toUpperCase();
  
  if (cnpjLimpo.length !== 14) return cnpj;
  
  return `${cnpjLimpo.substring(0, 2)}.${cnpjLimpo.substring(2, 5)}.${cnpjLimpo.substring(5, 8)}/${cnpjLimpo.substring(8, 12)}-${cnpjLimpo.substring(12, 14)}`;
};

/**
 * Normaliza CNPJ para envio ao backend (maiúsculo, sem formatação)
 */
const normalizarCnpj = (cnpj: string): string => {
  return cnpj.replace(/[^\w]/g, '').toUpperCase();
};

// ==================== TIPOS ====================

interface Endereco {
  id?: number;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  tipoEndereco: 'RESIDENCIAL' | 'COMERCIAL' | 'COBRANCA' | 'ENTREGA';
  ativo?: boolean;
  principal?: boolean;
}

interface Email {
  id?: number;
  email: string;
  tipoEmail: 'PESSOAL' | 'COMERCIAL' | 'COBRANCA';
  ativo: boolean;
  principal?: boolean;
}

interface Telefone {
  id?: number;
  ddd: string;
  numero: string;
  tipoTelefone: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL' | 'FAX';
  whatsapp: boolean;
  ativo: boolean;
  principal?: boolean;
}

interface ProdutoHabilitado {
  id: number;
  tipo: string;
  produto: string;
  valor: number;
  associadoProdutoId?: number; // ID do registro na tabela associado_produto
  configuracao?: {
    valorDefinido?: number;
    statusNoProcesso?: 'A' | 'I';
    observacao?: string;
    tipoEnvioId?: number;
    dataAdesao?: string;
    dataInicio?: string;
    dataFim?: string;
    dataReinicio?: string;
    envioPadrao?: boolean;
    utilizaEnriquecimento?: boolean;
    deduzirDoPlano?: boolean;
  };
}

interface ProdutoDisponivel {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  tipo: string;
  valor: number;
  ativo: boolean;
}

interface ParametroFaturamento {
  diaEmissao: number;
  diaVencimento: number;
  observacao: string;
}

interface AssociadoFormData {
  id?: number;
  vendedorId?: number;
  vendedorExternoId?: number;
  dataFiliacao?: string;
  dataInativacao?: string;
  dataInicioSuspensao?: string;
  dataFimSuspensao?: string;
  motivoInativacao?: string;
  motivoSuspensao?: string;
  planoId?: number;
  planoNome?: string;
  planoValor?: number;
  categoriaId?: number;
  codigoSpc?: string;
  codigoRm?: string;
  tipoPessoa: 'F' | 'J';
  cnpjCpf: string;
  nomeRazao: string;
  nomeFantasia?: string;
  status: 'A' | 'I' | 'S';
  faturamentoMinimo?: number;
  dataCadastro?: string;
  enderecos: Endereco[];
  emails: Email[];
  telefones: Telefone[];
  parametroFaturamento?: ParametroFaturamento;
  produtosHabilitados?: ProdutoHabilitado[];
}

interface Plano {
  id: number;
  idtipomodelo: number;
  plano: string;
  valor: number | null;
  observacao: string | null;
}

interface Categoria {
  id: number;
  descricao: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

const AssociadoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  // Refs para os inputs de pesquisa
  const planosPesquisaInputRef = useRef<HTMLInputElement>(null);
  const categoriasPesquisaInputRef = useRef<HTMLInputElement>(null);
  const produtosPesquisaInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para abas ativas
  const [abaAtiva, setAbaAtiva] = useState('dados-cadastrais');
  
  // Sub-abas para Endereços - ordem: Comercial, Cobrança, Residencial, Entrega
  const [subAbaEnderecos, setSubAbaEnderecos] = useState<'RESIDENCIAL' | 'COMERCIAL' | 'COBRANCA' | 'ENTREGA'>('COMERCIAL');
  
  // Sub-abas para Telefones - ordem: Comercial, Celular, Residencial, Fax
  const [subAbaTelefones, setSubAbaTelefones] = useState<'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL' | 'FAX'>('COMERCIAL');
  
  // Sub-abas para Emails - ordem: Comercial, Pessoal, Cobrança
  const [subAbaEmails, setSubAbaEmails] = useState<'PESSOAL' | 'COMERCIAL' | 'COBRANCA'>('COMERCIAL');
  
  // Estado para modais
  const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
  const [modalPlanosAberto, setModalPlanosAberto] = useState(false);
  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);
  
  // Estado para pesquisa em modais
  const [produtosPesquisa, setProdutosPesquisa] = useState('');
  const [planosPesquisa, setPlanosPesquisa] = useState('');
  const [categoriasPesquisa, setCategoriasPesquisa] = useState('');
  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  
  // ESTADOS PARA CONFIGURAÇÃO DE PRODUTOS
  const [modalConfigProdutoAberto, setModalConfigProdutoAberto] = useState(false);
  const [produtoSelecionadoParaConfig, setProdutoSelecionadoParaConfig] = useState<ProdutoDisponivel | null>(null);
  const [configuracaoEditando, setConfiguracaoEditando] = useState<ProdutoHabilitado | null>(null);

  // ESTADOS PARA CONFIGURAÇÕES DE FATURAMENTO
  const [configuracoesFaturamento, setConfiguracoesFaturamento] = useState<AssociadoDefFaturamentoResumo[]>([]);
  const [modalFaturamentoAberto, setModalFaturamentoAberto] = useState(false);
  const [configuracaoFaturamentoEditando, setConfiguracaoFaturamentoEditando] = useState<AssociadoDefFaturamentoResumo | null>(null);

  // Dados dinâmicos da API
  const [vendedoresInternos, setVendedoresInternos] = useState<VendedorResumoDTO[]>([]);
  const [vendedoresExternos, setVendedoresExternos] = useState<VendedorResumoDTO[]>([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<Plano[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoDisponivel[]>([]);
  
  // Hook para busca de CEP
  const { buscarCEP, buscando: buscandoCEP, erro: erroCEP } = useCEP();
  
  const [produtosHabilitados, setProdutosHabilitados] = useState<ProdutoHabilitado[]>([]);
  
  // Dados para parâmetro de faturamento (mantido para compatibilidade)
  const [parametroFaturamento, setParametroFaturamento] = useState<ParametroFaturamento>({
    diaEmissao: 26,
    diaVencimento: 10,
    observacao: ''
  });
  
  const [formData, setFormData] = useState<AssociadoFormData>({
    tipoPessoa: 'F',
    cnpjCpf: '',
    nomeRazao: '',
    status: 'A',
    enderecos: [],
    emails: [],
    telefones: [],
    parametroFaturamento: parametroFaturamento,
    produtosHabilitados: produtosHabilitados
  });

  // ==================== FUNÇÕES AUXILIARES ====================

  /**
   * Verifica se um produto é do tipo notificação
   */
  const isProdutoNotificacao = (produto: ProdutoDisponivel | { tipo?: string; nome?: string }): boolean => {
    const tipo = 'tipo' in produto ? produto.tipo : '';
    const nome = 'nome' in produto ? produto.nome : '';
    
    return tipo?.toUpperCase().includes('NOTIFICAÇÃO') || 
           tipo?.toUpperCase().includes('SPC') ||
           nome?.toUpperCase().includes('NOTIFICAÇÃO');
  };

  // Função para exibir mensagens
  const showMessage = (texto: string, tipo: 'success' | 'error') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 5000);
  };

  // Obter cor baseada no status
  const getStatusColor = (status: 'A' | 'I' | 'S') => {
    switch (status) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'S': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'I': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obter texto do status
  const getStatusText = (status: 'A' | 'I' | 'S') => {
    switch (status) {
      case 'A': return 'Ativo';
      case 'S': return 'Suspenso';
      case 'I': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  // ==================== FUNÇÕES PARA FATURAMENTO ====================

  /**
   * Carregar configurações de faturamento do associado (para edição)
   */
  const carregarConfiguracoesFaturamento = async (associadoId: number) => {
    try {
      const data = await associadoDefFaturamentoService.listarPorAssociado(associadoId);
      setConfiguracoesFaturamento(data);
      console.log('Configurações de faturamento carregadas:', data);
    } catch (error) {
      console.log('Configurações de faturamento não disponíveis:', error);
    }
  };

  /**
   * Handler para salvar configuração do faturamento (do modal)
   */
  const handleSalvarConfiguracaoFaturamento = async (config: ConfiguracaoFaturamento) => {
    try {
      if (configuracaoFaturamentoEditando) {
        // É EDIÇÃO - atualizar configuração existente
        if (formData.id) {
          // Se já tem ID, enviar para API
          await associadoDefFaturamentoService.atualizar(configuracaoFaturamentoEditando.id, {
            ...config,
            associadoId: formData.id
          }, 'SISTEMA');
          await carregarConfiguracoesFaturamento(formData.id);
        } else {
          // Se não tem ID, atualizar localmente
          setConfiguracoesFaturamento(prev => 
            prev.map(c => c.id === configuracaoFaturamentoEditando.id 
              ? { ...c, ...config }
              : c
            )
          );
        }
        showMessage('Configuração atualizada com sucesso!', 'success');
      } else {
        // É NOVO - adicionar nova configuração
        if (formData.id) {
          // Se já tem ID, enviar para API
          await associadoDefFaturamentoService.criar({
            ...config,
            associadoId: formData.id
          }, 'SISTEMA');
          await carregarConfiguracoesFaturamento(formData.id);
        } else {
          // Se não tem ID, adicionar localmente
          const novaConfig: AssociadoDefFaturamentoResumo = {
            id: Date.now(), // ID temporário
            associadoId: 0,
            associadoNome: '',
            ...config
          };
          setConfiguracoesFaturamento([...configuracoesFaturamento, novaConfig]);
        }
        showMessage('Configuração adicionada com sucesso!', 'success');
      }
      
      setModalFaturamentoAberto(false);
      setConfiguracaoFaturamentoEditando(null);
      
    } catch (error) {
      console.error('Erro ao salvar configuração de faturamento:', error);
      showMessage('Erro ao salvar configuração de faturamento', 'error');
    }
  };

  /**
   * Handler para editar configuração de faturamento
   */
  const handleEditarConfiguracaoFaturamento = (id: number) => {
    const config = configuracoesFaturamento.find(c => c.id === id);
    if (config) {
      setConfiguracaoFaturamentoEditando(config);
      setModalFaturamentoAberto(true);
    }
  };

  /**
   * Handler para excluir configuração de faturamento
   */
  const handleExcluirConfiguracaoFaturamento = async (id: number) => {
    try {
      if (formData.id) {
        // Se já tem ID, excluir do backend
        await associadoDefFaturamentoService.excluir(id);
        await carregarConfiguracoesFaturamento(formData.id);
      } else {
        // Se não tem ID, excluir localmente
        setConfiguracoesFaturamento(prev => prev.filter(c => c.id !== id));
      }
      showMessage('Configuração removida com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir configuração:', error);
      showMessage('Erro ao excluir configuração', 'error');
    }
  };

  // ==================== EFEITOS ====================

  // Efeito para focar no input de pesquisa quando o modal abre
  useEffect(() => {
    if (modalPlanosAberto && planosPesquisaInputRef.current) {
      setTimeout(() => {
        planosPesquisaInputRef.current?.focus();
      }, 100);
    }
  }, [modalPlanosAberto]);

  useEffect(() => {
    if (modalCategoriasAberto && categoriasPesquisaInputRef.current) {
      setTimeout(() => {
        categoriasPesquisaInputRef.current?.focus();
      }, 100);
    }
  }, [modalCategoriasAberto]);

  useEffect(() => {
    if (modalProdutosAberto && produtosPesquisaInputRef.current) {
      setTimeout(() => {
        produtosPesquisaInputRef.current?.focus();
      }, 100);
    }
  }, [modalProdutosAberto]);

  // Carregar dados iniciais e combos
  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      try {
        // Carregar vendedores usando os endpoints específicos do backend
        await carregarVendedores();
        
        // Carregar categorias
        await carregarCategorias();
        
        // Carregar planos
        await carregarPlanos();
        
        // Carregar produtos ativos para o modal
        await carregarProdutos();
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showMessage('Erro ao carregar dados do sistema', 'error');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  // Função para carregar vendedores
  const carregarVendedores = async () => {
    try {
      // Buscar vendedores do tipo 1 (internos) ativos
      const vendedoresTipo1 = await vendedorService.buscarVendedoresTipo1Ativos();
      setVendedoresInternos(vendedoresTipo1);
      
      // Buscar vendedores do tipo 2 (externos) ativos
      const vendedoresTipo2 = await vendedorService.buscarVendedoresTipo2Ativos();
      setVendedoresExternos(vendedoresTipo2);
      
      console.log('Vendedores carregados:', {
        internos: vendedoresTipo1.length,
        externos: vendedoresTipo2.length
      });
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      showMessage('Erro ao carregar vendedores', 'error');
      setVendedoresInternos([]);
      setVendedoresExternos([]);
    }
  };

  // Função para carregar categorias
  const carregarCategorias = async () => {
    try {
      const categorias = await associadoService.listarCategorias();
      
      const categoriasFormatadas: Categoria[] = categorias.map(cat => ({
        id: cat.id,
        descricao: cat.descricao || cat.nome || `Categoria ${cat.id}`
      }));
      
      setCategoriasDisponiveis(categoriasFormatadas);
      console.log('Categorias carregadas:', categoriasFormatadas.length);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      showMessage('Erro ao carregar categorias', 'error');
      setCategoriasDisponiveis([]);
    }
  };

  // Função para carregar planos
  const carregarPlanos = async () => {
    try {
      const planos = await associadoService.listarPlanos();
      
      const planosFormatados: Plano[] = planos.map(plano => ({
        id: plano.id,
        idtipomodelo: plano.idtipomodelo || 1,
        plano: plano.plano || plano.descricao || `Plano ${plano.id}`,
        valor: plano.valor,
        observacao: plano.observacao || null
      }));
      
      setPlanosDisponiveis(planosFormatados);
      console.log('Planos carregados:', planosFormatados.length);
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      showMessage('Erro ao carregar planos', 'error');
      setPlanosDisponiveis([]);
    }
  };

  // Função para carregar produtos ativos
  const carregarProdutos = async () => {
    try {
      // Usar o endpoint /api/produtos/ativos para buscar produtos ativos
      const produtos = await produtoService.listarProdutosAtivos();
      
      // Converter para o formato esperado pelo modal
      const produtosFormatados: ProdutoDisponivel[] = produtos.map(produto => ({
        id: produto.id,
        codigo: produto.codigo || `PROD${produto.id}`,
        nome: produto.nome || produto.descricao || `Produto ${produto.id}`,
        descricao: produto.descricao || '',
        tipo: produto.tipoProduto || produto.categoria || 'Geral',
        valor: produto.valor || 0,
        ativo: produto.ativo !== false
      }));
      
      setProdutosDisponiveis(produtosFormatados);
      console.log('Produtos carregados:', produtosFormatados.length);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      showMessage('Erro ao carregar produtos', 'error');
      setProdutosDisponiveis([]);
    }
  };

  // Função para carregar produtos habilitados na edição
  const carregarProdutosHabilitados = async (associadoId: number) => {
    try {
      const produtosHabilitadosData = await associadoProdutoService.listarPorAssociado(associadoId);
      
      // Converter para o formato local com todas as configurações
      const produtosFormatados: ProdutoHabilitado[] = produtosHabilitadosData.map(item => ({
        id: item.produtoId,
        associadoProdutoId: item.id,
        tipo: item.tipoProduto || 'Geral',
        produto: item.produtoNome,
        valor: item.valorEfetivo,
        configuracao: {
          valorDefinido: item.valorDefinido,
          statusNoProcesso: item.statusNoProcesso,
          observacao: item.observacao,
          tipoEnvioId: item.tipoEnvioId,
          dataAdesao: item.dataAdesao,
          dataInicio: item.dataInicio,
          dataFim: item.dataFim,
          dataReinicio: item.dataReinicio,
          envioPadrao: item.envioPadrao,
          utilizaEnriquecimento: item.utilizaEnriquecimento,
          deduzirDoPlano: item.deduzirDoPlano
        }
      }));
      
      setProdutosHabilitados(produtosFormatados);
      console.log('Produtos habilitados carregados:', produtosFormatados);
    } catch (error) {
      console.log('Produtos habilitados não disponíveis:', error);
    }
  };

  // Carregar dados do associado para edição
  useEffect(() => {
    const carregarAssociado = async () => {
      if (!isEditMode || !id) return;
      
      setLoading(true);
      try {
        const associadoDTO = await associadoService.buscarPorId(parseInt(id));
        
        console.log('Associado carregado:', associadoDTO);
        
        // Carregar produtos habilitados usando o novo serviço
        await carregarProdutosHabilitados(parseInt(id));
        
        // Carregar configurações de faturamento
        await carregarConfiguracoesFaturamento(parseInt(id));

        // Carregar plano selecionado
        if (associadoDTO.planoId) {
          // Buscar o plano na lista de planos disponíveis
          const planoEncontrado = planosDisponiveis.find(p => p.id === associadoDTO.planoId);
          if (planoEncontrado) {
            setPlanoSelecionado(planoEncontrado);
            
            // Atualizar também o formData
            setFormData(prev => ({
              ...prev,
              planoId: planoEncontrado.id,
              planoNome: planoEncontrado.plano,
              planoValor: planoEncontrado.valor
            }));
          } else {
            // Se não encontrou na lista, criar um objeto temporário
            const planoTemp = {
              id: associadoDTO.planoId,
              idtipomodelo: 1,
              plano: associadoDTO.planoNome || `Plano ${associadoDTO.planoId}`,
              valor: associadoDTO.planoValor,
              observacao: null
            };
            setPlanoSelecionado(planoTemp);
            
            setFormData(prev => ({
              ...prev,
              planoId: planoTemp.id,
              planoNome: planoTemp.plano,
              planoValor: planoTemp.valor
            }));
          }
        }

        // Carregar categoria selecionada
        if (associadoDTO.categoriaId) {
          const categoriaEncontrada = categoriasDisponiveis.find(c => c.id === associadoDTO.categoriaId);
          if (categoriaEncontrada) {
            setCategoriaSelecionada(categoriaEncontrada);
            
            setFormData(prev => ({
              ...prev,
              categoriaId: categoriaEncontrada.id
            }));
          } else {
            // Se não encontrou na lista, criar objeto temporário
            const categoriaTemp = {
              id: associadoDTO.categoriaId,
              descricao: `Categoria ${associadoDTO.categoriaId}`
            };
            setCategoriaSelecionada(categoriaTemp);
            
            setFormData(prev => ({
              ...prev,
              categoriaId: categoriaTemp.id
            }));
          }
        }
        
        // Converter DTO para formato do formulário
        const formDataConvertido: AssociadoFormData = {
          id: associadoDTO.id,
          tipoPessoa: associadoDTO.tipoPessoa,
          cnpjCpf: associadoDTO.cnpjCpf,
          nomeRazao: associadoDTO.nomeRazao,
          nomeFantasia: associadoDTO.nomeFantasia,
          status: associadoDTO.status,
          codigoSpc: associadoDTO.codigoSpc,
          codigoRm: associadoDTO.codigoRm,
          faturamentoMinimo: associadoDTO.faturamentoMinimo,
          dataFiliacao: associadoDTO.dataFiliacao,
          dataCadastro: associadoDTO.dataCadastro,
          vendedorId: associadoDTO.vendedorId,
          vendedorExternoId: associadoDTO.vendedorExternoId,
          planoId: associadoDTO.planoId,
          planoNome: associadoDTO.planoNome,
          planoValor: associadoDTO.planoValor,
          categoriaId: associadoDTO.categoriaId,
          dataInativacao: associadoDTO.dataInativacao,
          dataInicioSuspensao: associadoDTO.dataInicioSuspensao,
          dataFimSuspensao: associadoDTO.dataFimSuspensao,
          motivoInativacao: associadoDTO.motivoInativacao,
          motivoSuspensao: associadoDTO.motivoSuspensao,
          parametroFaturamento: parametroFaturamento,
          produtosHabilitados: produtosHabilitados,
          
          // Endereços - preservar IDs
          enderecos: associadoDTO.enderecos && associadoDTO.enderecos.length > 0 
            ? associadoDTO.enderecos.map((endereco: EnderecoDTO) => ({
                id: endereco.id, // IMPORTANTE: Manter o ID original
                cep: endereco.cep || '',
                logradouro: endereco.logradouro || '',
                numero: endereco.numero || '',
                complemento: endereco.complemento || '',
                bairro: endereco.bairro || '',
                cidade: endereco.cidade || '',
                estado: endereco.estado || '',
                tipoEndereco: (endereco.tipoEndereco as any) || 'COMERCIAL',
                ativo: true,
                principal: endereco.tipoEndereco === 'COMERCIAL',
              }))
            : inicializarTiposPadrao().enderecosPadrao,
          
          // Telefones - preservar IDs
          telefones: associadoDTO.telefones && associadoDTO.telefones.length > 0
            ? associadoDTO.telefones.map((telefone: TelefoneDTO) => ({
                id: telefone.id, // IMPORTANTE: Manter o ID original
                ddd: telefone.ddd || '',
                numero: telefone.numero || '',
                tipoTelefone: (telefone.tipoTelefone as any) || 'CELULAR',
                whatsapp: telefone.whatsapp || false,
                ativo: telefone.ativo !== undefined ? telefone.ativo : true,
                principal: telefone.tipoTelefone === 'CELULAR',
              }))
            : inicializarTiposPadrao().telefonesPadrao,
          
          // Emails - preservar IDs
          emails: associadoDTO.emails && associadoDTO.emails.length > 0
            ? associadoDTO.emails.map((email: EmailDTO) => ({
                id: email.id, // IMPORTANTE: Manter o ID original
                email: email.email || '',
                tipoEmail: (email.tipoEmail as any) || 'COMERCIAL',
                ativo: email.ativo !== undefined ? email.ativo : true,
                principal: email.tipoEmail === 'COMERCIAL',
              }))
            : inicializarTiposPadrao().emailsPadrao,
        };
        
        setFormData(formDataConvertido);
      } catch (error) {
        console.error('Erro ao carregar associado:', error);
        showMessage('Associado não encontrado', 'error');
        navigate('/associados');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      carregarAssociado();
    } else {
      // Para novo associado, inicializar com tipos padrão
      const { enderecosPadrao, telefonesPadrao, emailsPadrao } = inicializarTiposPadrao();
      
      setFormData(prev => ({
        ...prev,
        enderecos: enderecosPadrao,
        telefones: telefonesPadrao,
        emails: emailsPadrao,
        parametroFaturamento: parametroFaturamento,
        produtosHabilitados: []
      }));
      
      // Limpar seleções para novo associado
      setPlanoSelecionado(null);
      setCategoriaSelecionada(null);
      setConfiguracoesFaturamento([]);
      setProdutosHabilitados([]);
    }
  }, [id, isEditMode, navigate]);

  // Componente de Loading
  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700">Carregando...</p>
      </div>
    </div>
  );

  // Componente de BreadCrumb
  const BreadCrumb = () => (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <button
            onClick={() => navigate('/associados')}
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
          >
            <svg className="w-3 h-3 mr-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
            </svg>
            Associados
          </button>
        </li>
        <li aria-current="page">
          <div className="flex items-center">
            <svg className="w-3 h-3 mx-1 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4"/>
            </svg>
            <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
              {isEditMode ? 'Editar Associado' : 'Novo Associado'}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );

  // Componente de Modal para Seleção de Planos
  const ModalPlanos = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Plano</h3>
              <p className="text-sm text-gray-600 mt-1">Selecione um plano para este associado</p>
            </div>
            <button
              onClick={() => setModalPlanosAberto(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Barra de pesquisa */}
          <div className="mb-6">
            <input
              ref={planosPesquisaInputRef}
              type="text"
              value={planosPesquisa}
              onChange={(e) => setPlanosPesquisa(e.target.value)}
              placeholder="Pesquisar planos por nome ou valor..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          
          {/* Lista de planos disponíveis */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selecionar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plano
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo Modelo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor R$
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planosDisponiveis
                  .filter(plano => 
                    plano.plano.toLowerCase().includes(planosPesquisa.toLowerCase()) ||
                    (plano.valor && plano.valor.toString().includes(planosPesquisa)) ||
                    plano.id.toString().includes(planosPesquisa)
                  )
                  .map((plano) => (
                    <tr 
                      key={plano.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${planoSelecionado?.id === plano.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setPlanoSelecionado(plano)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="radio"
                          name="planoSelecionado"
                          checked={planoSelecionado?.id === plano.id}
                          onChange={() => setPlanoSelecionado(plano)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {plano.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{plano.plano}</div>
                          {plano.observacao && (
                            <div className="text-sm text-gray-500">{plano.observacao}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          plano.idtipomodelo === 1 ? 'bg-green-100 text-green-800' :
                          plano.idtipomodelo === 2 ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          Tipo {plano.idtipomodelo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {plano.valor ? (
                          plano.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        ) : (
                          <span className="text-gray-400">Não definido</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Plano selecionado preview */}
          {planoSelecionado && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-blue-800">Plano Selecionado:</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">{planoSelecionado.plano}</span>
                    {planoSelecionado.valor && (
                      <span className="ml-2 font-semibold">
                        - {planoSelecionado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setPlanoSelecionado(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}
          
          {/* Contador e ações */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {planosDisponiveis.length} plano(s) disponível(is)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setModalPlanosAberto(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSelecionarPlano}
                disabled={!planoSelecionado}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selecionar Plano
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de Modal para Seleção de Categorias
  const ModalCategorias = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Selecionar Categoria</h3>
              <p className="text-sm text-gray-600 mt-1">Selecione uma categoria para este associado</p>
            </div>
            <button
              onClick={() => setModalCategoriasAberto(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Barra de pesquisa */}
          <div className="mb-6">
            <input
              ref={categoriasPesquisaInputRef}
              type="text"
              value={categoriasPesquisa}
              onChange={(e) => setCategoriasPesquisa(e.target.value)}
              placeholder="Pesquisar categorias..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          
          {/* Lista de categorias disponíveis */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selecionar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoriasDisponiveis
                  .filter(categoria => 
                    categoria.descricao.toLowerCase().includes(categoriasPesquisa.toLowerCase()) ||
                    categoria.id.toString().includes(categoriasPesquisa)
                  )
                  .map((categoria) => (
                    <tr 
                      key={categoria.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${categoriaSelecionada?.id === categoria.id ? 'bg-blue-50' : ''}`}
                      onClick={() => setCategoriaSelecionada(categoria)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="radio"
                          name="categoriaSelecionada"
                          checked={categoriaSelecionada?.id === categoria.id}
                          onChange={() => setCategoriaSelecionada(categoria)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoria.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{categoria.descricao}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Categoria selecionada preview */}
          {categoriaSelecionada && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-blue-800">Categoria Selecionada:</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">{categoriaSelecionada.descricao}</span>
                  </p>
                </div>
                <button
                  onClick={() => setCategoriaSelecionada(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}
          
          {/* Contador e ações */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {categoriasDisponiveis.length} categoria(s) disponível(is)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setModalCategoriasAberto(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSelecionarCategoria}
                disabled={!categoriaSelecionada}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Selecionar Categoria
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Componente de Modal para Seleção de Produtos
  const ModalProdutos = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Adicionar Produtos</h3>
              <p className="text-sm text-gray-600 mt-1">Selecione os produtos para habilitar para este associado</p>
            </div>
            <button
              onClick={() => setModalProdutosAberto(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Barra de pesquisa */}
          <div className="mb-6">
            <input
              ref={produtosPesquisaInputRef}
              type="text"
              value={produtosPesquisa}
              onChange={(e) => setProdutosPesquisa(e.target.value)}
              placeholder="Pesquisar produtos por nome, código ou tipo..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          
          {/* Lista de produtos disponíveis */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Selecionar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor R$
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosDisponiveis
                  .filter(produto => 
                    produto.nome.toLowerCase().includes(produtosPesquisa.toLowerCase()) ||
                    produto.codigo.toLowerCase().includes(produtosPesquisa.toLowerCase()) ||
                    produto.tipo.toLowerCase().includes(produtosPesquisa.toLowerCase()) ||
                    produto.descricao.toLowerCase().includes(produtosPesquisa.toLowerCase())
                  )
                  .map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={produtosSelecionados.includes(produto.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setProdutosSelecionados([...produtosSelecionados, produto.id]);
                            } else {
                              setProdutosSelecionados(produtosSelecionados.filter(id => id !== produto.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {produto.codigo}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                          <div className="text-sm text-gray-500">{produto.descricao}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {produto.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          
          {/* Contador e ações */}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {produtosSelecionados.length} produto(s) selecionado(s)
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setModalProdutosAberto(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdicionarProdutosSelecionados}
                disabled={produtosSelecionados.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar Produtos Selecionados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Função para inicializar endereços, telefones e emails com tipos padrão
  const inicializarTiposPadrao = () => {
    // Inicializar endereços com os 4 tipos - COMERCIAL como principal
    const enderecosPadrao: Endereco[] = [
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'COMERCIAL', ativo: true, principal: true },
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'COBRANCA', ativo: true, principal: false },
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'RESIDENCIAL', ativo: true, principal: false },
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'ENTREGA', ativo: true, principal: false },
    ];

    // Inicializar telefones com os 4 tipos - COMERCIAL como principal
    const telefonesPadrao: Telefone[] = [
      { ddd: '', numero: '', tipoTelefone: 'COMERCIAL', whatsapp: false, ativo: true, principal: true },
      { ddd: '', numero: '', tipoTelefone: 'CELULAR', whatsapp: true, ativo: true, principal: false },
      { ddd: '', numero: '', tipoTelefone: 'RESIDENCIAL', whatsapp: false, ativo: true, principal: false },
      { ddd: '', numero: '', tipoTelefone: 'FAX', whatsapp: false, ativo: true, principal: false },
    ];

    // Inicializar emails com os 3 tipos - COMERCIAL como principal
    const emailsPadrao: Email[] = [
      { email: '', tipoEmail: 'COMERCIAL', ativo: true, principal: true },
      { email: '', tipoEmail: 'PESSOAL', ativo: true, principal: false },
      { email: '', tipoEmail: 'COBRANCA', ativo: true, principal: false },
    ];

    return { enderecosPadrao, telefonesPadrao, emailsPadrao };
  };

  // Buscar CEP usando o hook
  const handleBuscarCEP = async (index: number) => {
    const cep = formData.enderecos[index]?.cep?.replace(/\D/g, '');
    
    if (!cep || cep.length !== 8) {
      showMessage('CEP inválido', 'error');
      return;
    }

    try {
      const enderecoEncontrado = await buscarCEP(cep);
      
      if (!enderecoEncontrado) {
        showMessage(erroCEP || 'CEP não encontrado', 'error');
        return;
      }

      const novosEnderecos = [...formData.enderecos];
      novosEnderecos[index] = {
        ...novosEnderecos[index],
        logradouro: enderecoEncontrado.logradouro || '',
        bairro: enderecoEncontrado.bairro || '',
        cidade: enderecoEncontrado.localidade || '',
        estado: enderecoEncontrado.uf || '',
        cep: enderecoEncontrado.cep || cep,
      };
      
      setFormData(prev => ({
        ...prev,
        enderecos: novosEnderecos
      }));
      
      showMessage('CEP encontrado com sucesso!', 'success');
    } catch (error) {
      showMessage('Erro ao buscar CEP', 'error');
    }
  };

  // ==================== FUNÇÕES DE REPLICAÇÃO CORRIGIDAS ====================

  // Replicar dados do endereço principal
  const handleReplicarEnderecoPrincipal = () => {
    // Encontrar o endereço COMERCIAL (que é o principal)
    const enderecoPrincipal = formData.enderecos.find(e => e.tipoEndereco === 'COMERCIAL');
    
    if (!enderecoPrincipal) {
      showMessage('Endereço COMERCIAL não encontrado para usar como referência', 'error');
      return;
    }

    // Verificar se o endereço principal tem dados mínimos
    if (!enderecoPrincipal.cep?.trim() || !enderecoPrincipal.logradouro?.trim()) {
      showMessage('O endereço COMERCIAL deve ter CEP e Logradouro preenchidos para ser usado como referência', 'error');
      return;
    }

    // Replicar para TODOS os outros endereços (exceto o COMERCIAL)
    const novosEnderecos = formData.enderecos.map((endereco) => {
      if (endereco.tipoEndereco !== 'COMERCIAL') {
        return {
          ...endereco,
          id: endereco.id, // Preservar o ID
          cep: enderecoPrincipal.cep,
          logradouro: enderecoPrincipal.logradouro,
          numero: enderecoPrincipal.numero,
          complemento: enderecoPrincipal.complemento || '',
          bairro: enderecoPrincipal.bairro,
          cidade: enderecoPrincipal.cidade,
          estado: enderecoPrincipal.estado,
        };
      }
      return endereco;
    });
    
    setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
    showMessage('Dados replicados para todos os endereços!', 'success');
  };

  // Replicar dados do telefone principal
  const handleReplicarTelefonePrincipal = () => {
    // Encontrar o telefone COMERCIAL (que é o principal)
    const telefonePrincipal = formData.telefones.find(t => t.tipoTelefone === 'COMERCIAL');
    
    if (!telefonePrincipal) {
      showMessage('Telefone COMERCIAL não encontrado para usar como referência', 'error');
      return;
    }

    // Verificar se o telefone principal tem dados mínimos
    if (!telefonePrincipal.ddd?.trim() || !telefonePrincipal.numero?.trim()) {
      showMessage('O telefone COMERCIAL deve ter DDD e número preenchidos para ser usado como referência', 'error');
      return;
    }

    // Replicar para TODOS os outros telefones (exceto o COMERCIAL)
    const novosTelefones = formData.telefones.map((telefone) => {
      if (telefone.tipoTelefone !== 'COMERCIAL') {
        return {
          ...telefone,
          id: telefone.id, // Preservar o ID
          ddd: telefonePrincipal.ddd,
          numero: telefonePrincipal.numero,
          whatsapp: telefone.tipoTelefone === 'CELULAR' ? telefonePrincipal.whatsapp : false,
        };
      }
      return telefone;
    });
    
    setFormData(prev => ({ ...prev, telefones: novosTelefones }));
    showMessage('Dados replicados para todos os telefones!', 'success');
  };

  // Replicar dados do email principal
  const handleReplicarEmailPrincipal = () => {
    // Encontrar o email COMERCIAL (que é o principal)
    const emailPrincipal = formData.emails.find(e => e.tipoEmail === 'COMERCIAL');
    
    if (!emailPrincipal) {
      showMessage('E-mail COMERCIAL não encontrado para usar como referência', 'error');
      return;
    }

    // Verificar se o email principal tem dados
    if (!emailPrincipal.email?.trim()) {
      showMessage('O e-mail COMERCIAL deve ser preenchido para ser usado como referência', 'error');
      return;
    }

    // Replicar para TODOS os outros emails (exceto o COMERCIAL)
    const novosEmails = formData.emails.map((email) => {
      if (email.tipoEmail !== 'COMERCIAL') {
        return {
          ...email,
          id: email.id, // Preservar o ID
          email: emailPrincipal.email,
        };
      }
      return email;
    });
    
    setFormData(prev => ({ ...prev, emails: novosEmails }));
    showMessage('Dados replicados para todos os e-mails!', 'success');
  };

  // ==================== FUNÇÕES PARA PRODUTOS ====================

  /**
   * Salva produtos habilitados (com configuração)
   */
  const salvarProdutosHabilitados = async (produtos: ProdutoHabilitado[]) => {
    try {
      // Para novos associados (sem ID ainda), apenas adicionar localmente
      if (!formData.id) {
        const produtosExistentesIds = produtosHabilitados.map(p => p.id);
        const produtosNovos = produtos.filter(p => !produtosExistentesIds.includes(p.id));
        
        if (produtosNovos.length > 0) {
          setProdutosHabilitados([...produtosHabilitados, ...produtosNovos]);
          showMessage(`${produtosNovos.length} produto(s) adicionado(s) localmente!`, 'success');
        }
        return;
      }

      // Para associados existentes, enviar para API
      const produtosParaAPI = produtos.map(p => {
        // Buscar o produto original para obter o tipo
        const produtoOriginal = produtosDisponiveis.find(dp => dp.id === p.id);
        
        return {
          associadoId: formData.id!,
          produtoId: p.id,
          valorDefinido: p.configuracao?.valorDefinido,
          statusNoProcesso: p.configuracao?.statusNoProcesso || 'A',
          observacao: p.configuracao?.observacao || null,
          tipoProduto: produtoOriginal?.tipo || p.tipo,
          
          // Campos de notificação (podem vir undefined)
          tipoEnvioId: p.configuracao?.tipoEnvioId || null,
          dataAdesao: p.configuracao?.dataAdesao || null,
          dataInicio: p.configuracao?.dataInicio || null,
          dataFim: p.configuracao?.dataFim || null,
          dataReinicio: p.configuracao?.dataReinicio || null,
          envioPadrao: p.configuracao?.envioPadrao || false,
          utilizaEnriquecimento: p.configuracao?.utilizaEnriquecimento || false,
          deduzirDoPlano: p.configuracao?.deduzirDoPlano || false
        };
      });

      console.log('Enviando produtos para API:', produtosParaAPI);

      const result = await associadoProdutoService.criarEmLote(produtosParaAPI, 'SISTEMA');

      console.log('Resposta da API (produtos):', result);

      // Mapear o resultado para o formato local
      const novosProdutosHabilitados = result.map((item, index) => {
        const produtoOriginal = produtosDisponiveis.find(p => p.id === produtos[index].id);
        
        return {
          id: item.produtoId,
          associadoProdutoId: item.id, // IMPORTANTE: Guardar o ID do registro
          tipo: produtoOriginal?.tipo || produtos[index].tipo,
          produto: produtoOriginal?.nome || produtos[index].produto,
          valor: item.valorDefinido || produtoOriginal?.valor || produtos[index].valor,
          configuracao: {
            valorDefinido: item.valorDefinido,
            statusNoProcesso: item.statusNoProcesso as 'A' | 'I',
            observacao: item.observacao,
            tipoEnvioId: item.tipoEnvioId,
            dataAdesao: item.dataAdesao,
            dataInicio: item.dataInicio,
            dataFim: item.dataFim,
            dataReinicio: item.dataReinicio,
            envioPadrao: item.envioPadrao,
            utilizaEnriquecimento: item.utilizaEnriquecimento,
            deduzirDoPlano: item.deduzirDoPlano
          }
        };
      });

      // Evitar duplicatas
      const produtosExistentesIds = produtosHabilitados.map(p => p.id);
      const produtosRealmenteNovos = novosProdutosHabilitados.filter(p => !produtosExistentesIds.includes(p.id));
      
      if (produtosRealmenteNovos.length > 0) {
        setProdutosHabilitados([...produtosHabilitados, ...produtosRealmenteNovos]);
        showMessage(`${produtosRealmenteNovos.length} produto(s) adicionado(s) com sucesso!`, 'success');
      } else {
        showMessage('Produtos já estão na lista', 'info');
      }
      
    } catch (error) {
      console.error('Erro ao salvar produtos:', error);
      throw error;
    }
  };

  /**
   * Handler para salvar configuração do produto (quando abre modal)
   */
  const handleSalvarConfiguracaoProduto = async (config: ConfiguracaoProduto) => {
    if (!produtoSelecionadoParaConfig) return;

    try {
      // Calcular o valor a ser exibido
      const valorExibido = config.valorDefinido || produtoSelecionadoParaConfig.valor;

      if (configuracaoEditando) {
        // É EDIÇÃO - atualizar o produto existente
        setProdutosHabilitados(prev => 
          prev.map(p => {
            if (p.id === produtoSelecionadoParaConfig.id) {
              return {
                ...p,
                valor: valorExibido,
                configuracao: {
                  ...config,
                  valorDefinido: config.valorDefinido
                }
              };
            }
            return p;
          })
        );
        
        // Se for edição e o associado já existe, salvar no backend
        if (formData.id) {
          const produtoExistente = produtosHabilitados.find(p => p.id === produtoSelecionadoParaConfig.id);
          if (produtoExistente?.associadoProdutoId) {
            await associadoProdutoService.atualizar(
              produtoExistente.associadoProdutoId,
              {
                associadoId: formData.id,
                produtoId: produtoSelecionadoParaConfig.id,
                valorDefinido: config.valorDefinido,
                statusNoProcesso: config.statusNoProcesso || 'A',
                observacao: config.observacao || null,
                tipoProduto: produtoSelecionadoParaConfig.tipo,
                tipoEnvioId: config.tipoEnvioId || null,
                dataAdesao: config.dataAdesao || null,
                dataInicio: config.dataInicio || null,
                dataFim: config.dataFim || null,
                dataReinicio: config.dataReinicio || null,
                envioPadrao: config.envioPadrao || false,
                utilizaEnriquecimento: config.utilizaEnriquecimento || false,
                deduzirDoPlano: config.deduzirDoPlano || false
              },
              'SISTEMA'
            );
          }
        }
        
        showMessage('Produto atualizado com sucesso!', 'success');
      } else {
        // É NOVO PRODUTO - verificar se já existe antes de adicionar
        const produtoJaExiste = produtosHabilitados.some(p => p.id === produtoSelecionadoParaConfig.id);
        
        if (produtoJaExiste) {
          showMessage('Este produto já está na lista de habilitados', 'warning');
          return;
        }

        const novoProduto: ProdutoHabilitado = {
          id: produtoSelecionadoParaConfig.id,
          tipo: produtoSelecionadoParaConfig.tipo,
          produto: produtoSelecionadoParaConfig.nome,
          valor: valorExibido,
          configuracao: {
            ...config,
            valorDefinido: config.valorDefinido
          }
        };

        setProdutosHabilitados(prev => [...prev, novoProduto]);
        
        // Se o associado já existe, salvar imediatamente no backend
        if (formData.id) {
          const result = await associadoProdutoService.criar({
            associadoId: formData.id,
            produtoId: produtoSelecionadoParaConfig.id,
            valorDefinido: config.valorDefinido,
            statusNoProcesso: config.statusNoProcesso || 'A',
            observacao: config.observacao || null,
            tipoProduto: produtoSelecionadoParaConfig.tipo,
            tipoEnvioId: config.tipoEnvioId || null,
            dataAdesao: config.dataAdesao || null,
            dataInicio: config.dataInicio || null,
            dataFim: config.dataFim || null,
            dataReinicio: config.dataReinicio || null,
            envioPadrao: config.envioPadrao || false,
            utilizaEnriquecimento: config.utilizaEnriquecimento || false,
            deduzirDoPlano: config.deduzirDoPlano || false
          }, 'SISTEMA');
          
          // Atualizar o produto com o ID do registro
          setProdutosHabilitados(prev => 
            prev.map(p => 
              p.id === produtoSelecionadoParaConfig.id 
                ? { ...p, associadoProdutoId: result.id } 
                : p
            )
          );
        }
        
        showMessage('Produto adicionado com sucesso!', 'success');
      }
      
      // Limpar TODOS os estados relacionados ao modal
      setModalConfigProdutoAberto(false);
      setProdutoSelecionadoParaConfig(null);
      setConfiguracaoEditando(null);
      setProdutosSelecionados([]); // IMPORTANTE: Limpar seleções
      setModalProdutosAberto(false); // Fechar modal de produtos se estiver aberto
      
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      showMessage('Erro ao salvar configuração do produto', 'error');
    }
  };

  // Handler para editar produto
  const handleEditarProduto = (id: number) => {
    const produtoHabilitado = produtosHabilitados.find(p => p.id === id);
    if (!produtoHabilitado) return;
    
    const produtoOriginal = produtosDisponiveis.find(p => p.id === id);
    if (!produtoOriginal) return;
    
    // Preparar configuração inicial com os dados existentes
    const configuracaoInicial: ConfiguracaoProduto = {
      valorDefinido: produtoHabilitado.configuracao?.valorDefinido,
      statusNoProcesso: produtoHabilitado.configuracao?.statusNoProcesso || 'A',
      observacao: produtoHabilitado.configuracao?.observacao,
      tipoEnvioId: produtoHabilitado.configuracao?.tipoEnvioId,
      dataAdesao: produtoHabilitado.configuracao?.dataAdesao,
      dataInicio: produtoHabilitado.configuracao?.dataInicio,
      dataFim: produtoHabilitado.configuracao?.dataFim,
      dataReinicio: produtoHabilitado.configuracao?.dataReinicio,
      envioPadrao: produtoHabilitado.configuracao?.envioPadrao,
      utilizaEnriquecimento: produtoHabilitado.configuracao?.utilizaEnriquecimento,
      deduzirDoPlano: produtoHabilitado.configuracao?.deduzirDoPlano
    };
    
    setProdutoSelecionadoParaConfig(produtoOriginal);
    setConfiguracaoEditando({ ...produtoHabilitado, configuracao: configuracaoInicial });
    setModalConfigProdutoAberto(true);
  };

  // Handler para excluir produto
  const handleExcluirProduto = async (id: number) => {
    try {
      // Encontrar o produto na lista
      const produto = produtosHabilitados.find(p => p.id === id);
      
      // Se for associado existente e tem ID do registro, excluir do backend
      if (formData.id && produto?.associadoProdutoId) {
        await associadoProdutoService.excluir(produto.associadoProdutoId);
        showMessage('Produto removido com sucesso!', 'success');
      } else {
        showMessage('Produto removido localmente', 'info');
      }
      
      setProdutosHabilitados(prev => prev.filter(produto => produto.id !== id));
      
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      setProdutosHabilitados(prev => prev.filter(produto => produto.id !== id));
      showMessage('Produto removido localmente', 'info');
    }
  };

  // Handler para adicionar produtos selecionados
  const handleAdicionarProdutosSelecionados = async () => {
    try {
      if (produtosSelecionados.length === 0) {
        showMessage('Nenhum produto selecionado', 'info');
        return;
      }

      // Se for apenas UM produto, abre modal de configuração
      if (produtosSelecionados.length === 1) {
        const produto = produtosDisponiveis.find(p => p.id === produtosSelecionados[0]);
        if (produto) {
          // Verificar se produto já está na lista
          const produtoJaExiste = produtosHabilitados.some(p => p.id === produto.id);
          if (produtoJaExiste) {
            showMessage('Este produto já está na lista de habilitados', 'warning');
            setProdutosSelecionados([]); // Limpar seleção
            setModalProdutosAberto(false); // Fechar modal
            return;
          }
          
          setProdutoSelecionadoParaConfig(produto);
          setConfiguracaoEditando(null);
          setModalConfigProdutoAberto(true);
          // NÃO fechar o modal de produtos ainda - vai fechar quando salvar configuração
        }
        return;
      }

      // Se for múltiplos produtos, filtra os que já existem
      const produtosNovos = produtosDisponiveis
        .filter(produto => produtosSelecionados.includes(produto.id))
        .filter(produto => !produtosHabilitados.some(p => p.id === produto.id)); // Exclui já existentes

      if (produtosNovos.length === 0) {
        showMessage('Todos os produtos selecionados já estão na lista', 'warning');
        setProdutosSelecionados([]);
        setModalProdutosAberto(false);
        return;
      }

      // Adiciona direto com valores padrão
      const produtosParaAdicionar = produtosNovos.map(produto => ({
        id: produto.id,
        tipo: produto.tipo,
        produto: produto.nome,
        valor: produto.valor,
        configuracao: {
          valorDefinido: produto.valor,
          statusNoProcesso: 'A' as const,
          // Para notificação, campos opcionais ficam vazios
          ...(isProdutoNotificacao(produto) ? {
            envioPadrao: false,
            utilizaEnriquecimento: false,
            deduzirDoPlano: false
          } : {})
        }
      }));

      await salvarProdutosHabilitados(produtosParaAdicionar);
      
      // Limpar seleções e fechar modal
      setProdutosSelecionados([]);
      setModalProdutosAberto(false);
      
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      showMessage('Erro ao adicionar produtos', 'error');
    }
  };

  // Handler para selecionar plano
  const handleSelecionarPlano = () => {
    if (planoSelecionado) {
      setFormData(prev => ({
        ...prev,
        planoId: planoSelecionado.id,
        planoNome: planoSelecionado.plano,
        planoValor: planoSelecionado.valor
      }));
      
      setModalPlanosAberto(false);
      setPlanosPesquisa('');
      showMessage(`Plano "${planoSelecionado.plano}" selecionado com sucesso!`, 'success');
    }
  };

  // Handler para selecionar categoria
  const handleSelecionarCategoria = () => {
    if (categoriaSelecionada) {
      setFormData(prev => ({
        ...prev,
        categoriaId: categoriaSelecionada.id
      }));
      
      setModalCategoriasAberto(false);
      setCategoriasPesquisa('');
      showMessage(`Categoria "${categoriaSelecionada.descricao}" selecionada com sucesso!`, 'success');
    }
  };

  // Handler para limpar seleção de plano
  const handleLimparPlano = () => {
    setFormData(prev => ({
      ...prev,
      planoId: undefined,
      planoNome: undefined,
      planoValor: undefined
    }));
    setPlanoSelecionado(null);
    showMessage('Plano removido', 'info');
  };

  // Handler para limpar seleção de categoria
  const handleLimparCategoria = () => {
    setFormData(prev => ({
      ...prev,
      categoriaId: undefined
    }));
    setCategoriaSelecionada(null);
    showMessage('Categoria removida', 'info');
  };

  // ==================== VALIDAÇÃO DO FORMULÁRIO ====================

  const validarFormulario = (): boolean => {
    const novosErros: Record<string, string> = {};
  
    // Validação do CPF/CNPJ
    if (!formData.cnpjCpf?.trim()) {
      novosErros.cnpjCpf = '❌ CPF/CNPJ é obrigatório';
    } else {
      const cnpjCpfLimpo = normalizarCnpj(formData.cnpjCpf);
      
      if (formData.tipoPessoa === 'F') {
        if (cnpjCpfLimpo.length !== 11) {
          novosErros.cnpjCpf = '❌ CPF deve ter 11 dígitos';
        } else if (!/^\d+$/.test(cnpjCpfLimpo)) {
          novosErros.cnpjCpf = '❌ CPF deve conter apenas números';
        }
      } else {
        if (cnpjCpfLimpo.length !== 14) {
          novosErros.cnpjCpf = '❌ CNPJ deve ter 14 caracteres';
        } else {
          // Validar o CNPJ com a nova regra alfanumérica
          const dataAtual = new Date();
          const dataLimite = new Date('2026-07-01');
          
          if (dataAtual >= dataLimite && !validarCnpj(cnpjCpfLimpo)) {
            novosErros.cnpjCpf = '❌ CNPJ inválido';
          }
        }
      }
    }
  
    // Nome/Razão Social obrigatório
    if (!formData.nomeRazao?.trim()) {
      novosErros.nomeRazao = '❌ Nome/Razão Social é obrigatório';
    }
  
    // Nome Fantasia obrigatório apenas para PJ
    if (formData.tipoPessoa === 'J' && !formData.nomeFantasia?.trim()) {
      novosErros.nomeFantasia = '❌ Nome Fantasia é obrigatório para Pessoa Jurídica';
    }
  
    // Validar endereço COMERCIAL com dados mínimos
    const enderecoComercial = formData.enderecos.find(e => e.tipoEndereco === 'COMERCIAL');
    if (!enderecoComercial) {
      novosErros.endereco = '❌ Endereço COMERCIAL é obrigatório';
    } else if (!enderecoComercial.cep?.trim()) {
      novosErros.endereco = '❌ Endereço COMERCIAL: CEP é obrigatório';
    } else if (!enderecoComercial.logradouro?.trim()) {
      novosErros.endereco = '❌ Endereço COMERCIAL: Logradouro é obrigatório';
    }
  
    // Validar telefone COMERCIAL com dados mínimos
    const telefoneComercial = formData.telefones.find(t => t.tipoTelefone === 'COMERCIAL');
    if (!telefoneComercial) {
      novosErros.telefone = '❌ Telefone COMERCIAL é obrigatório';
    } else if (!telefoneComercial.ddd?.trim()) {
      novosErros.telefone = '❌ Telefone COMERCIAL: DDD é obrigatório';
    } else if (!telefoneComercial.numero?.trim()) {
      novosErros.telefone = '❌ Telefone COMERCIAL: Número é obrigatório';
    }
  
    // Validar email COMERCIAL
    const emailComercial = formData.emails.find(e => e.tipoEmail === 'COMERCIAL');
    if (!emailComercial) {
      novosErros.email = '❌ E-mail COMERCIAL é obrigatório';
    } else if (!emailComercial.email?.trim()) {
      novosErros.email = '❌ E-mail COMERCIAL deve ser preenchido';
    } else if (!emailComercial.email.includes('@') || !emailComercial.email.includes('.')) {
      novosErros.email = '❌ E-mail COMERCIAL inválido';
    }
  
    setErros(novosErros);
    
    // Se houver erros, mostrar mensagem com a contagem
    if (Object.keys(novosErros).length > 0) {
      const campos = Object.keys(novosErros).length;
      showMessage(`⚠️ ${campos} campo(s) obrigatório(s) não preenchido(s). Verifique os campos destacados.`, 'error');
    }
    
    return Object.keys(novosErros).length === 0;
  };

  // Handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    let valorFinal: any = value;
    
    if (type === 'number') {
      valorFinal = value === '' ? undefined : parseFloat(value);
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      valorFinal = target.checked;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: valorFinal
    }));

    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleChangeNested = (
    section: 'enderecos' | 'telefones' | 'emails',
    index: number,
    field: string,
    value: any
  ) => {
    setFormData(prev => {
      const updated = [...prev[section]];
      
      if (field === 'principal' && value === true) {
        updated.forEach((item, i) => {
          if (i !== index && 
              ((section === 'enderecos' && item.tipoEndereco === updated[index].tipoEndereco) ||
               (section === 'telefones' && item.tipoTelefone === updated[index].tipoTelefone) ||
               (section === 'emails' && item.tipoEmail === updated[index].tipoEmail))) {
            (item as any).principal = false;
          }
        });
      }
      
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, [section]: updated };
    });

    const erroKey = `${section.slice(0, -1)}_${index}_${field}`;
    if (erros[erroKey]) {
      setErros(prev => ({ ...prev, [erroKey]: '' }));
    }
  };

  // Handler para parâmetro de faturamento (mantido para compatibilidade)
  const handleParametroFaturamentoChange = (
    field: keyof ParametroFaturamento,
    value: string | number
  ) => {
    setParametroFaturamento(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler para mudança de status
  const handleStatusChange = (novoStatus: 'A' | 'I' | 'S') => {
    setFormData(prev => {
      const updated = { ...prev, status: novoStatus };
      
      if (novoStatus === 'A') {
        updated.dataInativacao = undefined;
        updated.motivoInativacao = undefined;
        updated.dataInicioSuspensao = undefined;
        updated.dataFimSuspensao = undefined;
        updated.motivoSuspensao = undefined;
      } else if (novoStatus === 'I') {
        updated.dataInativacao = new Date().toISOString().split('T')[0];
        updated.dataInicioSuspensao = undefined;
        updated.dataFimSuspensao = undefined;
        updated.motivoSuspensao = undefined;
      } else if (novoStatus === 'S') {
        updated.dataInicioSuspensao = new Date().toISOString().split('T')[0];
        const dataFim = new Date();
        dataFim.setMonth(dataFim.getMonth() + 1);
        updated.dataFimSuspensao = dataFim.toISOString().split('T')[0];
        updated.dataInativacao = undefined;
        updated.motivoInativacao = undefined;
      }
      
      return updated;
    });
  };

  // ==================== FUNÇÃO CONVERTER PARA DTO CORRIGIDA ====================

  const converterParaDTO = (data: AssociadoFormData): AssociadoDTO => {
    // Função auxiliar para converter string vazia para null
    const emptyToNull = (value: any): any => {
      if (value === undefined || value === null) return null;
      if (typeof value === 'string' && value.trim() === '') return null;
      return value;
    };
  
    // Função para converter ID para número
    const parseId = (id: any): number | null => {
      if (id === undefined || id === null) return null;
      if (typeof id === 'string') {
        const parsed = parseInt(id, 10);
        return isNaN(parsed) ? null : parsed;
      }
      if (typeof id === 'number') return id;
      return null;
    };
  
    // Endereços - preservar IDs e incluir TODOS os endereços
    const enderecosParaEnviar = (data.enderecos || []).map(endereco => ({
      id: endereco.id, // IMPORTANTE: Incluir o ID para atualização
      cep: endereco.cep?.trim() || '',
      logradouro: endereco.logradouro?.trim() || '',
      numero: endereco.numero?.trim() || '',
      complemento: endereco.complemento?.trim() || '',
      bairro: endereco.bairro?.trim() || '',
      cidade: endereco.cidade?.trim() || '',
      estado: endereco.estado?.trim() || '',
      tipoEndereco: endereco.tipoEndereco || 'COMERCIAL',
    }));
  
    // Telefones - preservar IDs e incluir TODOS os telefones
    const telefonesParaEnviar = (data.telefones || []).map(telefone => ({
      id: telefone.id, // IMPORTANTE: Incluir o ID para atualização
      ddd: telefone.ddd?.trim() || '',
      numero: telefone.numero?.trim() || '',
      tipoTelefone: telefone.tipoTelefone || 'CELULAR',
      whatsapp: telefone.whatsapp || false,
      ativo: telefone.ativo !== false,
    }));
  
    // Emails - preservar IDs e incluir TODOS os emails
    const emailsParaEnviar = (data.emails || []).map(email => ({
      id: email.id, // IMPORTANTE: Incluir o ID para atualização
      email: email.email?.trim() || '',
      tipoEmail: email.tipoEmail || 'COMERCIAL',
      ativo: email.ativo !== false,
    }));
  
    // Construir o DTO final
    const dto: AssociadoDTO = {
      id: data.id,
      tipoPessoa: data.tipoPessoa || 'F',
      cnpjCpf: normalizarCnpj(data.cnpjCpf || ''),
      nomeRazao: data.nomeRazao?.trim() || '',
      nomeFantasia: emptyToNull(data.nomeFantasia),
      status: data.status || 'A',
      codigoSpc: emptyToNull(data.codigoSpc),
      codigoRm: emptyToNull(data.codigoRm),
      faturamentoMinimo: data.faturamentoMinimo || null,
      dataFiliacao: emptyToNull(data.dataFiliacao),
      dataCadastro: emptyToNull(data.dataCadastro),
      vendedorId: parseId(data.vendedorId),
      vendedorExternoId: parseId(data.vendedorExternoId),
      planoId: parseId(data.planoId),
      planoNome: emptyToNull(data.planoNome),
      planoValor: data.planoValor || null,
      categoriaId: parseId(data.categoriaId),
      dataInativacao: emptyToNull(data.dataInativacao),
      dataInicioSuspensao: emptyToNull(data.dataInicioSuspensao),
      dataFimSuspensao: emptyToNull(data.dataFimSuspensao),
      motivoInativacao: emptyToNull(data.motivoInativacao),
      motivoSuspensao: emptyToNull(data.motivoSuspensao),
      
      // Enviar TODOS os arrays com IDs preservados, SEM FILTRAR
      enderecos: enderecosParaEnviar,
      telefones: telefonesParaEnviar,
      emails: emailsParaEnviar,
    };
  
    console.log('DTO processado para envio:', JSON.stringify(dto, null, 2));
    return dto;
  };

  // ==================== HANDLE SUBMIT ====================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setSalvando(true);
    
    try {
      const dto = converterParaDTO(formData);
      
      console.log('Enviando DTO para o backend:', JSON.stringify(dto, null, 2));
      
      if (isEditMode && formData.id) {
        await associadoService.atualizar(formData.id, dto);
        
        // Para edição, produtos já são salvos em tempo real
        // Mas garantir que produtos sem ID sejam salvos
        const produtosSemId = produtosHabilitados.filter(p => !p.associadoProdutoId);
        if (produtosSemId.length > 0) {
          await salvarProdutosHabilitados(produtosSemId);
        }
        
        showMessage('Associado atualizado com sucesso!', 'success');
      } else {
        const novoAssociado = await associadoService.criar(dto);
        
        // Se há produtos para adicionar e o associado foi criado
        if (produtosHabilitados.length > 0 && novoAssociado?.id) {
          try {
            const produtosParaAPI = produtosHabilitados.map(p => ({
              associadoId: novoAssociado.id,
              produtoId: p.id,
              valorDefinido: p.configuracao?.valorDefinido,
              statusNoProcesso: p.configuracao?.statusNoProcesso || 'A',
              observacao: p.configuracao?.observacao || null,
              tipoProduto: p.tipo,
              tipoEnvioId: p.configuracao?.tipoEnvioId || null,
              dataAdesao: p.configuracao?.dataAdesao || null,
              dataInicio: p.configuracao?.dataInicio || null,
              dataFim: p.configuracao?.dataFim || null,
              dataReinicio: p.configuracao?.dataReinicio || null,
              envioPadrao: p.configuracao?.envioPadrao || false,
              utilizaEnriquecimento: p.configuracao?.utilizaEnriquecimento || false,
              deduzirDoPlano: p.configuracao?.deduzirDoPlano || false
            }));

            console.log('Salvando produtos para novo associado:', produtosParaAPI);
            
            const result = await associadoProdutoService.criarEmLote(produtosParaAPI, 'SISTEMA');
            
            // Atualizar os produtos com os IDs retornados
            const produtosAtualizados = produtosHabilitados.map((p, index) => ({
              ...p,
              associadoProdutoId: result[index]?.id
            }));
            
            setProdutosHabilitados(produtosAtualizados);
            
            showMessage('Associado e produtos criados com sucesso!', 'success');
          } catch (prodError) {
            console.error('Erro ao adicionar produtos:', prodError);
            showMessage('Associado criado, mas houve erro ao adicionar produtos', 'warning');
          }
        } else {
          showMessage('Associado criado com sucesso!', 'success');
        }

        // Se há configurações de faturamento para adicionar
        if (configuracoesFaturamento.length > 0 && novoAssociado?.id) {
          try {
            const faturamentoParaAPI = configuracoesFaturamento.map(c => ({
              associadoId: novoAssociado.id,
              planoId: c.planoId,
              valorDef: c.valorDef,
              diaEmissao: c.diaEmissao,
              diaVencimento: c.diaVencimento,
              observacao: c.observacao
            }));

            await associadoDefFaturamentoService.criarEmLote(faturamentoParaAPI, 'SISTEMA');
            console.log('Configurações de faturamento salvas com sucesso');
            
          } catch (error) {
            console.error('Erro ao salvar configurações de faturamento:', error);
            showMessage('Associado criado, mas houve erro ao salvar configurações de faturamento', 'warning');
          }
        }
      }
      
      setTimeout(() => {
        navigate('/associados');
      }, 2000);
    } catch (error: any) {
      console.error('Erro detalhado ao salvar associado:', error);
      
      let mensagemErro = 'Erro ao salvar associado. Tente novamente.';
      
      if (error.response) {
        console.error('Dados do erro:', error.response.data);
        console.error('Status do erro:', error.response.status);
        
        mensagemErro = error.response.data?.message || 
                       error.response.data?.erro || 
                       `Erro ${error.response.status}: ${error.response.statusText}`;
      } else if (error.request) {
        mensagemErro = 'Servidor não respondeu. Verifique sua conexão.';
      } else {
        mensagemErro = error.message;
      }
      
      showMessage(mensagemErro, 'error');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => {
    navigate('/associados');
  };

  // Componente de abas principais
  const Abas = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex flex-wrap space-x-1">
        <button
          type="button"
          onClick={() => setAbaAtiva('dados-cadastrais')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'dados-cadastrais'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📋 Dados Cadastrais
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('relacionamento')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'relacionamento'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          👥 Relacionamento
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('enderecos-contatos')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'enderecos-contatos'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📍 Endereços e Contatos
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('parametro-faturamento')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'parametro-faturamento'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          💰 Parâmetro Faturamento
        </button>
        
        <button
          type="button"
          onClick={() => setAbaAtiva('produtos-habilitados')}
          className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
            abaAtiva === 'produtos-habilitados'
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📦 Produtos Habilitados
        </button>
      </nav>
    </div>
  );

  // Sub-abas para Endereços - Ordem: Comercial, Cobrança, Residencial, Entrega
  const SubAbasEnderecos = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('COMERCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'COMERCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Comercial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('COBRANCA')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'COBRANCA'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💰 Cobrança
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('RESIDENCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'RESIDENCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏠 Residencial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEnderecos('ENTREGA')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEnderecos === 'ENTREGA'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🚚 Entrega
        </button>
      </nav>
    </div>
  );

  // Sub-abas para Telefones - Ordem: Comercial, Celular, Residencial, Fax
  const SubAbasTelefones = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        <button
          type="button"
          onClick={() => setSubAbaTelefones('COMERCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'COMERCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Comercial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaTelefones('CELULAR')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'CELULAR'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📱 Celular
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaTelefones('RESIDENCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'RESIDENCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏠 Residencial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaTelefones('FAX')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaTelefones === 'FAX'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📠 Fax
        </button>
      </nav>
    </div>
  );

  // Sub-abas para Emails - Ordem: Comercial, Pessoal, Cobrança
  const SubAbasEmails = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        <button
          type="button"
          onClick={() => setSubAbaEmails('COMERCIAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEmails === 'COMERCIAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏢 Comercial
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEmails('PESSOAL')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEmails === 'PESSOAL'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👤 Pessoal
        </button>
        
        <button
          type="button"
          onClick={() => setSubAbaEmails('COBRANCA')}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            subAbaEmails === 'COBRANCA'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          💰 Cobrança
        </button>
      </nav>
    </div>
  );

  // Renderizar conteúdo baseado na aba ativa
  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'dados-cadastrais':
        return renderDadosCadastrais();
      case 'relacionamento':
        return renderRelacionamento();
      case 'enderecos-contatos':
        return renderEnderecosContatos();
      case 'parametro-faturamento':
        return renderParametroFaturamento();
      case 'produtos-habilitados':
        return renderProdutosHabilitados();
      default:
        return renderDadosCadastrais();
    }
  };

  // Formatador para plano selecionado
  const formatarPlanoSelecionado = () => {
    if (!formData.planoId) return null;
    
    let texto = formData.planoNome || '';
    
    if (formData.planoValor) {
      const valorFormatado = formData.planoValor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
      texto += ` - ${valorFormatado}`;
    }
    
    return texto;
  };

  // ==================== FUNÇÕES DE RENDERIZAÇÃO ====================

  const renderDadosCadastrais = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Dados Cadastrais</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo Pessoa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Pessoa *
          </label>
          <select
            name="tipoPessoa"
            value={formData.tipoPessoa}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="F">Pessoa Física</option>
            <option value="J">Pessoa Jurídica</option>
          </select>
        </div>

        {/* CPF/CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.tipoPessoa === 'F' ? 'CPF' : 'CNPJ'} *
          </label>
          <input
            type="text"
            name="cnpjCpf"
            value={formData.cnpjCpf}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              erros.cnpjCpf ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={formData.tipoPessoa === 'F' 
              ? '000.000.000-00' 
              : new Date() >= new Date('2026-07-01')
                ? 'AA.AAA.AAA/AAAA-AA'
                : '00.000.000/0000-00'}
            maxLength={formData.tipoPessoa === 'F' ? 14 : 18}
          />
          {erros.cnpjCpf && (
            <p className="mt-1 text-sm text-red-600">{erros.cnpjCpf}</p>
          )}
        </div>

        {/* Nome/Razão Social */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.tipoPessoa === 'F' ? 'Nome Completo' : 'Razão Social'} *
          </label>
          <input
            type="text"
            name="nomeRazao"
            value={formData.nomeRazao}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              erros.nomeRazao ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={formData.tipoPessoa === 'F' ? 'João da Silva' : 'Empresa LTDA'}
          />
          {erros.nomeRazao && (
            <p className="mt-1 text-sm text-red-600">{erros.nomeRazao}</p>
          )}
        </div>

        {/* Nome Fantasia */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Fantasia {formData.tipoPessoa === 'J' && '*'}
          </label>
          <input
            type="text"
            name="nomeFantasia"
            value={formData.nomeFantasia || ''}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              erros.nomeFantasia ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={formData.tipoPessoa === 'F' ? 'Opcional' : 'Nome comercial da empresa'}
          />
          {erros.nomeFantasia && (
            <p className="mt-1 text-sm text-red-600">{erros.nomeFantasia}</p>
          )}
        </div>

        {/* Data Filiação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Filiação
          </label>
          <input
            type="date"
            name="dataFiliacao"
            value={formData.dataFiliacao || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex items-center gap-3">
            <select
              name="status"
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value as 'A' | 'I' | 'S')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="A">Ativo</option>
              <option value="I">Inativo</option>
              <option value="S">Suspenso</option>
            </select>
            
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(formData.status)}`}>
              {getStatusText(formData.status)}
            </span>
          </div>
        </div>

        {/* Código SPC */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código SPC
          </label>
          <input
            type="text"
            name="codigoSpc"
            value={formData.codigoSpc || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Código no sistema SPC"
          />
        </div>

        {/* Código RM */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código RM
          </label>
          <input
            type="text"
            name="codigoRm"
            value={formData.codigoRm || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="Código no sistema RM"
          />
        </div>

        {/* Faturamento Mínimo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Faturamento Mínimo (R$)
          </label>
          <input
            type="number"
            name="faturamentoMinimo"
            value={formData.faturamentoMinimo || ''}
            onChange={handleChange}
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="0,00"
          />
        </div>
      </div>

      {(formData.status === 'I' || formData.status === 'S') && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-orange-600 rounded"></div>
            <h3 className="text-md font-semibold text-gray-800">
              {formData.status === 'I' ? 'Inativação' : 'Suspensão'}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.status === 'I' ? 'Data de Inativação' : 'Data de Início da Suspensão'} *
              </label>
              <input
                type="date"
                name={formData.status === 'I' ? 'dataInativacao' : 'dataInicioSuspensao'}
                value={formData.status === 'I' ? (formData.dataInativacao || '') : (formData.dataInicioSuspensao || '')}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            {formData.status === 'S' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim da Suspensão *
                </label>
                <input
                  type="date"
                  name="dataFimSuspensao"
                  value={formData.dataFimSuspensao || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.status === 'I' ? 'Motivo da Inativação' : 'Motivo da Suspensão'} *
              </label>
              <textarea
                name={formData.status === 'I' ? 'motivoInativacao' : 'motivoSuspensao'}
                value={formData.status === 'I' ? (formData.motivoInativacao || '') : (formData.motivoSuspensao || '')}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder={formData.status === 'I' ? 'Descreva o motivo da inativação...' : 'Descreva o motivo da suspensão...'}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRelacionamento = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-purple-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Relacionamento</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vendedor Interno (tipo = 1) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendedor Interno
          </label>
          <select
            name="vendedorId"
            value={formData.vendedorId || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Selecione um vendedor interno...</option>
            {vendedoresInternos.map(vendedor => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nomeRazao}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {vendedoresInternos.length} vendedor(es) interno(s) disponível(is)
          </p>
        </div>

        {/* Vendedor Externo (tipo = 2) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vendedor Externo
          </label>
          <select
            name="vendedorExternoId"
            value={formData.vendedorExternoId || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">Selecione um vendedor externo...</option>
            {vendedoresExternos.map(vendedor => (
              <option key={vendedor.id} value={vendedor.id}>
                {vendedor.nomeRazao}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {vendedoresExternos.length} vendedor(es) externo(s) disponível(is)
          </p>
        </div>

        {/* Plano com botão de pesquisa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plano
          </label>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setModalPlanosAberto(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between transition-all group"
            >
              <div className="text-left">
                <span className="text-gray-700">
                  {planoSelecionado ? formatarPlanoSelecionado() : 'Selecionar plano...'}
                </span>
                {!planoSelecionado && (
                  <p className="text-xs text-gray-500 mt-1">Clique para pesquisar planos disponíveis</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {planoSelecionado && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLimparPlano();
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remover plano"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
                <span className="text-gray-400 group-hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
              </div>
            </button>
            
            {planoSelecionado && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {planoSelecionado.plano}
                    </p>
                    {planoSelecionado.valor && (
                      <p className="text-sm text-blue-700 mt-1">
                        Valor: {planoSelecionado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalPlanosAberto(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Alterar
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {planosDisponiveis.length} planos disponíveis
          </p>
        </div>

        {/* Categoria com botão de pesquisa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setModalCategoriasAberto(true)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between transition-all group"
            >
              <div className="text-left">
                <span className="text-gray-700">
                  {categoriaSelecionada ? categoriaSelecionada.descricao : 'Selecionar categoria...'}
                </span>
                {!categoriaSelecionada && (
                  <p className="text-xs text-gray-500 mt-1">Clique para pesquisar categorias disponíveis</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {categoriaSelecionada && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLimparCategoria();
                    }}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Remover categoria"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
                <span className="text-gray-400 group-hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </span>
              </div>
            </button>
            
            {categoriaSelecionada && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {categoriaSelecionada.descricao}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalCategoriasAberto(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Alterar
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {categoriasDisponiveis.length} categorias disponíveis
          </p>
        </div>
      </div>
    </div>
  );

  const renderEnderecosContatos = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-green-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Endereços e Contatos</h2>
      </div>
      
      <div className="space-y-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-600 rounded"></div>
              <h3 className="text-md font-semibold text-gray-800">Endereços</h3>
            </div>
            <button
              type="button"
              onClick={handleReplicarEnderecoPrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm"
            >
              <span>📋</span>
              Replicar do Comercial
            </button>
          </div>
          <SubAbasEnderecos />
          {renderEnderecos()}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-yellow-600 rounded"></div>
              <h3 className="text-md font-semibold text-gray-800">Telefones</h3>
            </div>
            <button
              type="button"
              onClick={handleReplicarTelefonePrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm"
            >
              <span>📋</span>
              Replicar do Comercial
            </button>
          </div>
          <SubAbasTelefones />
          {renderTelefones()}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-red-600 rounded"></div>
              <h3 className="text-md font-semibold text-gray-800">E-mails</h3>
            </div>
            <button
              type="button"
              onClick={handleReplicarEmailPrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors text-sm"
            >
              <span>📋</span>
              Replicar do Comercial
            </button>
          </div>
          <SubAbasEmails />
          {renderEmails()}
        </div>
      </div>
    </div>
  );

  const renderParametroFaturamento = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-indigo-600 rounded"></div>
          <h2 className="text-lg font-semibold text-gray-800">Configurações de Faturamento</h2>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setConfiguracaoFaturamentoEditando(null);
            setModalFaturamentoAberto(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <span>➕</span>
          Nova Configuração
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dia Emissão
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dia Vencimento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plano
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observação
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configuracoesFaturamento.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Nenhuma configuração de faturamento. Clique em "Nova Configuração" para adicionar.
                </td>
              </tr>
            ) : (
              configuracoesFaturamento.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {config.diaEmissao}º dia
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {config.diaVencimento}º dia
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {config.planoNome || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {config.valorDef ? (
                      <span className="font-medium text-blue-600">
                        R$ {config.valorDef.toFixed(2)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                    {config.observacao || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditarConfiguracaoFaturamento(config.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirConfiguracaoFaturamento(config.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <span className="font-medium">ℹ️ Info:</span> Você pode cadastrar múltiplas configurações de faturamento com diferentes dias de emissão. 
          Isso permite que o associado tenha faturas geradas em várias datas do mês.
        </p>
      </div>
    </div>
  );

  const renderProdutosHabilitados = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-teal-600 rounded"></div>
          <h2 className="text-lg font-semibold text-gray-800">Produtos Habilitados</h2>
        </div>
        
        <button
          type="button"
          onClick={() => {
            setModalProdutosAberto(true);
            setProdutosSelecionados([]);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
        >
          <span>➕</span>
          Adicionar Produto
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produto
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor R$
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {produtosHabilitados.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Nenhum produto habilitado. Clique em "Adicionar Produto" para selecionar produtos.
                </td>
              </tr>
            ) : (
              produtosHabilitados.map((produto) => (
                <tr key={produto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {produto.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {produto.produto}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {produto.configuracao?.valorDefinido ? (
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-blue-600">
                          {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                          customizado
                        </span>
                      </div>
                    ) : (
                      produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditarProduto(produto.id)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExcluirProduto(produto.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Excluir"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Nota:</span> Estes são os produtos habilitados para este associado. 
          Clique em "Adicionar Produto" para pesquisar e adicionar novos produtos disponíveis no sistema.
        </p>
      </div>
    </div>
  );

  const renderEnderecos = () => {
    const enderecosDoTipo = formData.enderecos.filter(e => e.tipoEndereco === subAbaEnderecos);
    
    return (
      <div>
        {enderecosDoTipo.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">Nenhum endereço {subAbaEnderecos.toLowerCase()} cadastrado</p>
            <button
              type="button"
              onClick={() => {
                const newEndereco: Endereco = {
                  cep: '',
                  logradouro: '',
                  numero: '',
                  bairro: '',
                  cidade: '',
                  estado: '',
                  tipoEndereco: subAbaEnderecos,
                  ativo: true,
                  principal: false,
                };
                
                setFormData(prev => ({
                  ...prev,
                  enderecos: [...prev.enderecos, newEndereco]
                }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors mx-auto"
            >
              <span>➕</span>
              Adicionar Endereço {subAbaEnderecos}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {enderecosDoTipo.map((endereco, indexOriginal) => {
              const indexGlobal = formData.enderecos.findIndex(e => 
                e.id === endereco.id || 
                (e.cep === endereco.cep && e.logradouro === endereco.logradouro && e.numero === endereco.numero)
              );
              
              return (
                <div key={indexGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">
                        Endereço {subAbaEnderecos} {endereco.principal && '(Principal)'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {enderecosDoTipo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novosEnderecos = formData.enderecos.filter((_, i) => i !== indexGlobal);
                            setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
                          }}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          ✕ Remover
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* CEP */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={endereco.cep}
                          onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'cep', e.target.value)}
                          className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                            erros[`endereco_${indexGlobal}_cep`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="00000-000"
                        />
                        <button
                          type="button"
                          onClick={() => handleBuscarCEP(indexGlobal)}
                          disabled={buscandoCEP}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {buscandoCEP ? 'Buscando...' : 'Buscar CEP'}
                        </button>
                      </div>
                      {erros[`endereco_${indexGlobal}_cep`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_cep`]}</p>
                      )}
                    </div>

                    {/* Logradouro */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logradouro *
                      </label>
                      <input
                        type="text"
                        value={endereco.logradouro}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'logradouro', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_logradouro`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_logradouro`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_logradouro`]}</p>
                      )}
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={endereco.numero}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'numero', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_numero`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_numero`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_numero`]}</p>
                      )}
                    </div>

                    {/* Complemento */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <input
                        type="text"
                        value={endereco.complemento || ''}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'complemento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro *
                      </label>
                      <input
                        type="text"
                        value={endereco.bairro}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'bairro', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_bairro`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_bairro`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_bairro`]}</p>
                      )}
                    </div>

                    {/* Cidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade *
                      </label>
                      <input
                        type="text"
                        value={endereco.cidade}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'cidade', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_cidade`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {erros[`endereco_${indexGlobal}_cidade`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_cidade`]}</p>
                      )}
                    </div>

                    {/* UF */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UF *
                      </label>
                      <input
                        type="text"
                        value={endereco.estado}
                        onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'estado', e.target.value)}
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                          erros[`endereco_${indexGlobal}_estado`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        maxLength={2}
                        placeholder="SP"
                      />
                      {erros[`endereco_${indexGlobal}_estado`] && (
                        <p className="mt-1 text-sm text-red-600">{erros[`endereco_${indexGlobal}_estado`]}</p>
                      )}
                    </div>

                    {/* Principal - apenas COMERCIAL pode ser principal */}
                    {subAbaEnderecos === 'COMERCIAL' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={endereco.principal}
                          onChange={(e) => handleChangeNested('enderecos', indexGlobal, 'principal', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-700">
                          Principal
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            <button
              type="button"
              onClick={() => {
                const newEndereco: Endereco = {
                  cep: '',
                  logradouro: '',
                  numero: '',
                  bairro: '',
                  cidade: '',
                  estado: '',
                  tipoEndereco: subAbaEnderecos,
                  ativo: true,
                  principal: false,
                };
                
                setFormData(prev => ({
                  ...prev,
                  enderecos: [...prev.enderecos, newEndereco]
                }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <span>➕</span>
              Adicionar outro endereço {subAbaEnderecos}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTelefones = () => {
    const telefonesDoTipo = formData.telefones.filter(t => t.tipoTelefone === subAbaTelefones);
    
    return (
      <div>
        {telefonesDoTipo.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">Nenhum telefone {subAbaTelefones.toLowerCase()} cadastrado</p>
            <button
              type="button"
              onClick={() => {
                const newTelefone: Telefone = {
                  ddd: '',
                  numero: '',
                  tipoTelefone: subAbaTelefones,
                  whatsapp: subAbaTelefones === 'CELULAR',
                  ativo: true,
                  principal: false,
                };
                
                setFormData(prev => ({
                  ...prev,
                  telefones: [...prev.telefones, newTelefone]
                }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors mx-auto"
            >
              <span>➕</span>
              Adicionar Telefone {subAbaTelefones}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {telefonesDoTipo.map((telefone, indexOriginal) => {
              const indexGlobal = formData.telefones.findIndex(t => 
                t.id === telefone.id || 
                (t.ddd === telefone.ddd && t.numero === telefone.numero)
              );
              
              return (
                <div key={indexGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">
                        Telefone {subAbaTelefones} {telefone.principal && '(Principal)'}
                        {telefone.whatsapp && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            WhatsApp
                          </span>
                        )}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {telefonesDoTipo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novosTelefones = formData.telefones.filter((_, i) => i !== indexGlobal);
                            setFormData(prev => ({ ...prev, telefones: novosTelefones }));
                          }}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          ✕ Remover
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* DDD */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DDD *
                      </label>
                      <input
                        type="text"
                        value={telefone.ddd}
                        onChange={(e) => handleChangeNested('telefones', indexGlobal, 'ddd', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        maxLength={2}
                        placeholder="11"
                      />
                    </div>

                    {/* Número */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número *
                      </label>
                      <input
                        type="text"
                        value={telefone.numero}
                        onChange={(e) => handleChangeNested('telefones', indexGlobal, 'numero', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="99999-9999"
                      />
                    </div>

                    {/* Principal - apenas COMERCIAL pode ser principal */}
                    {subAbaTelefones === 'COMERCIAL' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={telefone.principal}
                          onChange={(e) => handleChangeNested('telefones', indexGlobal, 'principal', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-700">
                          Principal
                        </label>
                      </div>
                    )}

                    {/* WhatsApp (só para celular) */}
                    {subAbaTelefones === 'CELULAR' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={telefone.whatsapp}
                          onChange={(e) => handleChangeNested('telefones', indexGlobal, 'whatsapp', e.target.checked)}
                          className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                        />
                        <label className="text-sm text-gray-700">
                          WhatsApp
                        </label>
                      </div>
                    )}

                    {/* Ativo */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={telefone.ativo}
                        onChange={(e) => handleChangeNested('telefones', indexGlobal, 'ativo', e.target.checked)}
                        className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label className="text-sm text-gray-700">
                        Ativo
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button
              type="button"
              onClick={() => {
                const newTelefone: Telefone = {
                  ddd: '',
                  numero: '',
                  tipoTelefone: subAbaTelefones,
                  whatsapp: subAbaTelefones === 'CELULAR',
                  ativo: true,
                  principal: false,
                };
                
                setFormData(prev => ({
                  ...prev,
                  telefones: [...prev.telefones, newTelefone]
                }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <span>➕</span>
              Adicionar outro telefone {subAbaTelefones}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderEmails = () => {
    const emailsDoTipo = formData.emails.filter(e => e.tipoEmail === subAbaEmails);
    
    return (
      <div>
        {emailsDoTipo.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">Nenhum e-mail {subAbaEmails.toLowerCase()} cadastrado</p>
            <button
              type="button"
              onClick={() => {
                const newEmail: Email = {
                  email: '',
                  tipoEmail: subAbaEmails,
                  ativo: true,
                  principal: false,
                };
                
                setFormData(prev => ({
                  ...prev,
                  emails: [...prev.emails, newEmail]
                }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors mx-auto"
            >
              <span>➕</span>
              Adicionar E-mail {subAbaEmails}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {emailsDoTipo.map((email, indexOriginal) => {
              const indexGlobal = formData.emails.findIndex(e => 
                e.id === email.id || 
                e.email === email.email
              );
              
              return (
                <div key={indexGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-800">
                        E-mail {subAbaEmails} {email.principal && '(Principal)'}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {emailsDoTipo.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novosEmails = formData.emails.filter((_, i) => i !== indexGlobal);
                            setFormData(prev => ({ ...prev, emails: novosEmails }));
                          }}
                          className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                        >
                          ✕ Remover
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail *
                      </label>
                      <input
                        type="email"
                        value={email.email}
                        onChange={(e) => handleChangeNested('emails', indexGlobal, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="exemplo@email.com"
                      />
                    </div>

                    {/* Principal - apenas COMERCIAL pode ser principal */}
                    {subAbaEmails === 'COMERCIAL' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={email.principal}
                          onChange={(e) => handleChangeNested('emails', indexGlobal, 'principal', e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label className="text-sm text-gray-700">
                          Principal
                        </label>
                      </div>
                    )}

                    {/* Ativo */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={email.ativo}
                        onChange={(e) => handleChangeNested('emails', indexGlobal, 'ativo', e.target.checked)}
                        className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <label className="text-sm text-gray-700">
                        Ativo
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
            
            <button
              type="button"
              onClick={() => {
                const newEmail: Email = {
                  email: '',
                  tipoEmail: subAbaEmails,
                  ativo: true,
                  principal: false,
                };
                
                setFormData(prev => ({
                  ...prev,
                  emails: [...prev.emails, newEmail]
                }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2 transition-colors"
            >
              <span>➕</span>
              Adicionar outro e-mail {subAbaEmails}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumb />
      
      {mensagem && (
        <div className={`mb-6 p-4 rounded-lg ${mensagem.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <div className="flex items-center">
            <span className="mr-2">{mensagem.tipo === 'success' ? '✅' : '❌'}</span>
            <span>{mensagem.texto}</span>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Editar Associado' : 'Novo Associado'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode 
                ? 'Atualize as informações do associado' 
                : 'Preencha os dados para cadastrar um novo associado'}
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleCancelar}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <span>✕</span>
              Cancelar
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={salvando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <span>💾</span>
              {salvando ? 'Salvando...' : 'Salvar Associado'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Abas />
          {renderConteudoAba()}

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancelar}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <span>✕</span>
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <span>💾</span>
              {salvando ? 'Salvando...' : 'Salvar Associado'}
            </button>
          </div>
        </form>
      </div>

      {/* Renderizar modais condicionalmente dentro do JSX principal */}
      {modalProdutosAberto && <ModalProdutos />}
      {modalPlanosAberto && <ModalPlanos />}
      {modalCategoriasAberto && <ModalCategorias />}

      {/* MODAL DE CONFIGURAÇÃO DE PRODUTO */}
      {modalConfigProdutoAberto && produtoSelecionadoParaConfig && (
        <ModalConfigurarProduto
          produto={produtoSelecionadoParaConfig}
          aberto={modalConfigProdutoAberto}
          onFechar={() => {
            setModalConfigProdutoAberto(false);
            setProdutoSelecionadoParaConfig(null);
            setConfiguracaoEditando(null);
          }}
          onSalvar={handleSalvarConfiguracaoProduto}
          valorPadrao={produtoSelecionadoParaConfig.valor}
          configuracaoInicial={configuracaoEditando?.configuracao}
        />
      )}

      {/* MODAL DE CONFIGURAÇÃO DE FATURAMENTO */}
      <ModalConfigurarFaturamento
        aberto={modalFaturamentoAberto}
        onFechar={() => {
          setModalFaturamentoAberto(false);
          setConfiguracaoFaturamentoEditando(null);
        }}
        onSalvar={handleSalvarConfiguracaoFaturamento}
        configuracaoInicial={configuracaoFaturamentoEditando || undefined}
        diasExistentes={configuracoesFaturamento.map(c => c.diaEmissao)}
      />
    </div>
  );
};

export default AssociadoForm;