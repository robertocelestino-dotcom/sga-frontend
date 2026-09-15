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

import { associadoProdutoService } from '../services/associadoProdutoService';
import { tipoEnvioService } from '../services/tipoEnvioService';
import ModalConfigurarProduto from '../components/ModalConfigurarProduto';
import { ConfiguracaoProduto } from '../types/associadoProduto.types';

import { associadoDefFaturamentoService } from '../services/associadoDefFaturamentoService';
import ModalConfigurarFaturamento from '../components/ModalConfigurarFaturamento';
import { ConfiguracaoFaturamento, AssociadoDefFaturamentoResumo } from '../types/associadoDefFaturamento.types';

// ==================== UTILITÁRIOS CNPJ ====================

const converterCaractereParaValor = (char: string): number => {
  if (!char) return 0;
  if (/^\d$/.test(char)) return parseInt(char, 10);
  const charUpper = char.toUpperCase();
  return charUpper.charCodeAt(0) - 48;
};

const calcularDigitoVerificador = (base: string): string => {
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += converterCaractereParaValor(base[i]) * pesos1[i];
  }
  const resto = soma % 11;
  const dv1 = resto < 2 ? 0 : 11 - resto;

  const base2 = base + dv1.toString();
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < base2.length; i++) {
    soma += converterCaractereParaValor(base2[i]) * pesos2[i];
  }
  const resto2 = soma % 11;
  const dv2 = resto2 < 2 ? 0 : 11 - resto2;
  return `${dv1}${dv2}`;
};

const validarCnpjNumerico = (cnpj: string): boolean => {
  const limpo = cnpj.replace(/[^\d]/g, '');
  if (limpo.length !== 14) return false;
  if (/^(\d)\1+$/.test(limpo)) return false;

  let tamanho = limpo.length - 2;
  let numeros = limpo.substring(0, tamanho);
  const digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho += 1;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1));
};

const validarCnpj = (cnpj: string): boolean => {
  const limpo = cnpj.replace(/[^\w]/g, '').toUpperCase();
  if (limpo.length !== 14) return false;
  if (/^(\w)\1+$/.test(limpo)) return false;
  if (/^\d+$/.test(limpo)) return validarCnpjNumerico(limpo);
  const base = limpo.substring(0, 12);
  const dv = limpo.substring(12, 14);
  return dv === calcularDigitoVerificador(base);
};

const normalizarCnpj = (cnpj: string): string => cnpj.replace(/[^\w]/g, '').toUpperCase();

// ==================== HELPER DE COMPARAÇÃO DE IDs ====================
// Compara IDs ignorando diferença de tipo (number vs string).
// Resolve o bug clássico: `5 === "5" // false`
const idMatch = (a: any, b: any): boolean => {
  if (a === undefined || a === null || b === undefined || b === null) return false;
  return String(a) === String(b);
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
  associadoProdutoId?: number;
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

// ==================== COMPONENTE ====================

const AssociadoForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const planosPesquisaInputRef = useRef<HTMLInputElement>(null);
  const categoriasPesquisaInputRef = useRef<HTMLInputElement>(null);
  const produtosPesquisaInputRef = useRef<HTMLInputElement>(null);

  const [abaAtiva, setAbaAtiva] = useState('dados-cadastrais');
  const [subAbaEnderecos, setSubAbaEnderecos] = useState<'RESIDENCIAL' | 'COMERCIAL' | 'COBRANCA' | 'ENTREGA'>('COMERCIAL');
  const [subAbaTelefones, setSubAbaTelefones] = useState<'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL' | 'FAX'>('COMERCIAL');
  const [subAbaEmails, setSubAbaEmails] = useState<'PESSOAL' | 'COMERCIAL' | 'COBRANCA'>('COMERCIAL');

  const [modalProdutosAberto, setModalProdutosAberto] = useState(false);
  const [modalPlanosAberto, setModalPlanosAberto] = useState(false);
  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);
  const [modalConfigProdutoAberto, setModalConfigProdutoAberto] = useState(false);
  const [modalFaturamentoAberto, setModalFaturamentoAberto] = useState(false);

  const [produtosPesquisa, setProdutosPesquisa] = useState('');
  const [planosPesquisa, setPlanosPesquisa] = useState('');
  const [categoriasPesquisa, setCategoriasPesquisa] = useState('');

  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);
  const [planoSelecionado, setPlanoSelecionado] = useState<Plano | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [produtoSelecionadoParaConfig, setProdutoSelecionadoParaConfig] = useState<ProdutoDisponivel | null>(null);
  const [configuracaoEditando, setConfiguracaoEditando] = useState<ProdutoHabilitado | null>(null);
  const [configuracaoFaturamentoEditando, setConfiguracaoFaturamentoEditando] = useState<AssociadoDefFaturamentoResumo | null>(null);

  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});

  const [vendedoresInternos, setVendedoresInternos] = useState<VendedorResumoDTO[]>([]);
  const [vendedoresExternos, setVendedoresExternos] = useState<VendedorResumoDTO[]>([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState<Plano[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([]);
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoDisponivel[]>([]);
  const [produtosHabilitados, setProdutosHabilitados] = useState<ProdutoHabilitado[]>([]);
  const [configuracoesFaturamento, setConfiguracoesFaturamento] = useState<AssociadoDefFaturamentoResumo[]>([]);

  const { buscarCEP, buscando: buscandoCEP, erro: erroCEP } = useCEP();

  const [parametroFaturamento] = useState<ParametroFaturamento>({
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
    produtosHabilitados: []
  });

  // ==================== HELPERS ====================

  const normalizarResposta = (resp: any): any[] => {
    if (!resp) return [];
    if (Array.isArray(resp)) return resp;
    if (Array.isArray(resp.content)) return resp.content;
    if (Array.isArray(resp.data)) return resp.data;
    if (Array.isArray(resp.items)) return resp.items;
    console.warn('⚠️ Formato de resposta desconhecido:', resp);
    return [];
  };

  const isProdutoNotificacao = (produto: ProdutoDisponivel | { tipo?: string; nome?: string }): boolean => {
    const tipo = 'tipo' in produto ? produto.tipo : '';
    const nome = 'nome' in produto ? produto.nome : '';
    return tipo?.toUpperCase().includes('NOTIFICAÇÃO') || 
           tipo?.toUpperCase().includes('SPC') ||
           nome?.toUpperCase().includes('NOTIFICAÇÃO');
  };

  const showMessage = (texto: string, tipo: 'success' | 'error' | 'info' | 'warning') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem(null), 5000);
  };

  const getStatusColor = (status: 'A' | 'I' | 'S') => {
    switch (status) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'S': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'I': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: 'A' | 'I' | 'S') => {
    switch (status) {
      case 'A': return 'Ativo';
      case 'S': return 'Suspenso';
      case 'I': return 'Inativo';
      default: return 'Desconhecido';
    }
  };

  const inicializarTiposPadrao = () => {
    const enderecosPadrao: Endereco[] = [
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'COMERCIAL', ativo: true, principal: true },
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'COBRANCA', ativo: true, principal: false },
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'RESIDENCIAL', ativo: true, principal: false },
      { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: 'ENTREGA', ativo: true, principal: false },
    ];
    const telefonesPadrao: Telefone[] = [
      { ddd: '', numero: '', tipoTelefone: 'COMERCIAL', whatsapp: false, ativo: true, principal: true },
      { ddd: '', numero: '', tipoTelefone: 'CELULAR', whatsapp: true, ativo: true, principal: false },
      { ddd: '', numero: '', tipoTelefone: 'RESIDENCIAL', whatsapp: false, ativo: true, principal: false },
      { ddd: '', numero: '', tipoTelefone: 'FAX', whatsapp: false, ativo: true, principal: false },
    ];
    const emailsPadrao: Email[] = [
      { email: '', tipoEmail: 'COMERCIAL', ativo: true, principal: true },
      { email: '', tipoEmail: 'PESSOAL', ativo: true, principal: false },
      { email: '', tipoEmail: 'COBRANCA', ativo: true, principal: false },
    ];
    return { enderecosPadrao, telefonesPadrao, emailsPadrao };
  };

  // ==================== CARREGAMENTO DE COMBOS ====================

  const carregarVendedores = async () => {
    try {
      console.log('📦 Carregando vendedores...');

      const vendedoresTipo1Raw = await vendedorService.buscarVendedoresTipo1Ativos();
      console.log('   📥 Resposta BRUTA tipo 1:', vendedoresTipo1Raw);
      console.log('   📥 Tipo:', typeof vendedoresTipo1Raw, '| É array?', Array.isArray(vendedoresTipo1Raw));
      console.log('   📥 Length:', (vendedoresTipo1Raw as any)?.length);

      const listaTipo1 = normalizarResposta(vendedoresTipo1Raw).map((v: any) => ({
        id: v.id ?? v.idVendedor ?? v.id_vendedor,
        nomeRazao: v.nomeRazao ?? v.nomerazao ?? v.nome ?? v.name,
        ...v
      }));
      setVendedoresInternos(listaTipo1);
      console.log('   ✅ Internos:', listaTipo1.length, '| IDs:', listaTipo1.map((v: any) => v.id));

      const vendedoresTipo2Raw = await vendedorService.buscarVendedoresTipo2Ativos();
      console.log('   📥 Resposta BRUTA tipo 2:', vendedoresTipo2Raw);

      const listaTipo2 = normalizarResposta(vendedoresTipo2Raw).map((v: any) => ({
        id: v.id ?? v.idVendedor ?? v.id_vendedor,
        nomeRazao: v.nomeRazao ?? v.nomerazao ?? v.nome ?? v.name,
        ...v
      }));
      setVendedoresExternos(listaTipo2);
      console.log('   ✅ Externos:', listaTipo2.length, '| IDs:', listaTipo2.map((v: any) => v.id));

    } catch (error) {
      console.error('❌ Erro ao carregar vendedores:', error);
      setVendedoresInternos([]);
      setVendedoresExternos([]);
    }
  };

  const carregarCategorias = async () => {
    try {
      console.log('📦 Carregando categorias...');
      const categoriasRaw = await associadoService.listarCategorias();
      console.log('   📥 Resposta BRUTA categorias:', categoriasRaw);

      const categorias = normalizarResposta(categoriasRaw);
      const formatadas: Categoria[] = categorias.map((cat: any) => ({
        id: cat.id ?? cat.idCategoria ?? cat.id_categoria,
        descricao: cat.descricao ?? cat.nome ?? cat.descricao ?? `Categoria ${cat.id}`
      }));

      setCategoriasDisponiveis(formatadas);
      console.log('   ✅ Categorias:', formatadas.length);
      console.log('   🔎 Contém ID 97?', formatadas.some(c => idMatch(c.id, 97)));
      console.log('   🔎 Contém ID 189?', formatadas.some(c => idMatch(c.id, 189)));
      console.log('   📋 Primeiros IDs:', formatadas.slice(0, 5).map(c => `${c.id}(${typeof c.id})`));
    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      setCategoriasDisponiveis([]);
    }
  };

  const carregarPlanos = async () => {
    try {
      console.log('📦 Carregando planos...');
      const planosRaw = await associadoService.listarPlanos();
      console.log('   📥 Resposta BRUTA planos:', planosRaw);

      const planos = normalizarResposta(planosRaw);
      const formatados: Plano[] = planos.map((plano: any) => ({
        id: plano.id ?? plano.idPlano ?? plano.id_plano,
        idtipomodelo: plano.idtipomodelo ?? 1,
        plano: plano.plano ?? plano.descricao ?? `Plano ${plano.id}`,
        valor: plano.valor ?? null,
        observacao: plano.observacao ?? null
      }));

      setPlanosDisponiveis(formatados);
      console.log('   ✅ Planos:', formatados.length);
      console.log('   🔎 Contém ID 5?', formatados.some(p => idMatch(p.id, 5)));
      console.log('   📋 Primeiros IDs:', formatados.slice(0, 5).map(p => `${p.id}(${typeof p.id})`));
    } catch (error) {
      console.error('❌ Erro ao carregar planos:', error);
      setPlanosDisponiveis([]);
    }
  };

  const carregarProdutos = async () => {
    try {
      console.log('📦 Carregando produtos...');
      const produtosRaw = await produtoService.listarProdutosAtivos();
      const produtos = normalizarResposta(produtosRaw);

      const formatados: ProdutoDisponivel[] = produtos.map((produto: any) => ({
        id: produto.id,
        codigo: produto.codigo ?? `PROD${produto.id}`,
        nome: produto.nome ?? produto.descricao ?? `Produto ${produto.id}`,
        descricao: produto.descricao ?? '',
        tipo: produto.tipoProduto ?? produto.categoria ?? 'Geral',
        valor: produto.valor ?? 0,
        ativo: produto.ativo !== false
      }));

      setProdutosDisponiveis(formatados);
      console.log('   ✅ Produtos:', formatados.length);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      setProdutosDisponiveis([]);
    }
  };

  const carregarProdutosHabilitados = async (associadoId: number) => {
    try {
      console.log('📦 Carregando produtos habilitados:', associadoId);
      const produtosData = await associadoProdutoService.listarPorAssociado(associadoId);
      const lista = normalizarResposta(produtosData);

      const formatados: ProdutoHabilitado[] = lista.map((item: any) => ({
        id: item.produtoId,
        associadoProdutoId: item.id,
        tipo: item.tipoProduto ?? 'Geral',
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
      setProdutosHabilitados(formatados);
      console.log('   ✅ Produtos habilitados:', formatados.length);
    } catch (error) {
      console.log('ℹ️ Produtos habilitados não disponíveis:', error);
    }
  };

  const carregarConfiguracoesFaturamento = async (associadoId: number) => {
    try {
      console.log('📦 Carregando configurações de faturamento:', associadoId);
      const data = await associadoDefFaturamentoService.listarPorAssociado(associadoId);
      const lista = normalizarResposta(data);
      setConfiguracoesFaturamento(lista);
      console.log('   ✅ Configurações:', lista.length);
    } catch (error) {
      console.log('ℹ️ Configurações não disponíveis:', error);
      setConfiguracoesFaturamento([]);
    }
  };

  // ==================== EFFECT ÚNICO ====================

  useEffect(() => {
    const inicializar = async () => {
        setLoading(true);
        try {
            console.log('🚀 [INIT] Iniciando...');
            console.log('   Modo:', isEditMode ? 'EDIÇÃO' : 'CRIAÇÃO', '| ID:', id);

            // ============================================================
            // PASSO 1: Carregar combos e CAPTURAR retorno em variáveis locais
            // ============================================================
            let listaVendedoresInternos: VendedorResumoDTO[] = [];
            let listaVendedoresExternos: VendedorResumoDTO[] = [];
            let listaPlanos: Plano[] = [];
            let listaCategorias: Categoria[] = [];
            let listaProdutos: ProdutoDisponivel[] = [];

            // Vendedores internos
            try {
                listaVendedoresInternos = await vendedorService.buscarVendedoresTipo1Ativos() || [];
                console.log('✅ Internos:', listaVendedoresInternos.length);
            } catch (e) { console.error('❌ Vendedores internos:', e); }

            // Vendedores externos
            try {
                listaVendedoresExternos = await vendedorService.buscarVendedoresTipo2Ativos() || [];
                console.log('✅ Externos:', listaVendedoresExternos.length);
            } catch (e) { console.error('❌ Vendedores externos:', e); }

            // Categorias
            try {
                const categoriasRaw = await associadoService.listarCategorias();
                const categorias = normalizarResposta(categoriasRaw);
                listaCategorias = categorias.map((cat: any) => ({
                    id: cat.id ?? cat.idCategoria ?? cat.id_categoria,
                    descricao: cat.descricao ?? cat.nome ?? `Categoria ${cat.id}`
                }));
                console.log('✅ Categorias:', listaCategorias.length);
                console.log('   Contém ID 189?', listaCategorias.some(c => idMatch(c.id, 189)));
            } catch (e) { console.error('❌ Categorias:', e); }

            // Planos
            try {
                const planosRaw = await associadoService.listarPlanos();
                const planos = normalizarResposta(planosRaw);
                listaPlanos = planos.map((plano: any) => ({
                    id: plano.id ?? plano.idPlano ?? plano.id_plano,
                    idtipomodelo: plano.idtipomodelo ?? 1,
                    plano: plano.plano ?? plano.descricao ?? `Plano ${plano.id}`,
                    valor: plano.valor ?? null,
                    observacao: plano.observacao ?? null
                }));
                console.log('✅ Planos:', listaPlanos.length);
                console.log('   Contém ID 5?', listaPlanos.some(p => idMatch(p.id, 5)));
            } catch (e) { console.error('❌ Planos:', e); }

            // Produtos
            try {
                const produtosRaw = await produtoService.listarProdutosAtivos();
                const produtos = normalizarResposta(produtosRaw);
                listaProdutos = produtos.map((p: any) => ({
                    id: p.id,
                    codigo: p.codigo ?? `PROD${p.id}`,
                    nome: p.nome ?? p.descricao ?? `Produto ${p.id}`,
                    descricao: p.descricao ?? '',
                    tipo: p.tipoProduto ?? p.categoria ?? 'Geral',
                    valor: p.valor ?? 0,
                    ativo: p.ativo !== false
                }));
                console.log('✅ Produtos:', listaProdutos.length);
            } catch (e) { console.error('❌ Produtos:', e); }

            // 🔥 AGORA SIM - atualiza o state com as listas carregadas
            setVendedoresInternos(listaVendedoresInternos);
            setVendedoresExternos(listaVendedoresExternos);
            setCategoriasDisponiveis(listaCategorias);
            setPlanosDisponiveis(listaPlanos);
            setProdutosDisponiveis(listaProdutos);
            console.log('✅ [INIT] Combos carregados');

            // ============================================================
            // PASSO 2: Modo CRIAÇÃO
            // ============================================================
            if (!isEditMode || !id) {
                const { enderecosPadrao, telefonesPadrao, emailsPadrao } = inicializarTiposPadrao();
                setFormData(prev => ({
                    ...prev,
                    enderecos: enderecosPadrao,
                    telefones: telefonesPadrao,
                    emails: emailsPadrao,
                    parametroFaturamento: parametroFaturamento,
                    produtosHabilitados: []
                }));
                setPlanoSelecionado(null);
                setCategoriaSelecionada(null);
                setConfiguracoesFaturamento([]);
                setProdutosHabilitados([]);
                console.log('✅ [INIT] Modo CRIAÇÃO');
                return;
            }

            // ============================================================
            // PASSO 3: Modo EDIÇÃO — usa as LISTAS LOCAIS
            // ============================================================
            console.log('📦 [INIT] Carregando associado ID:', id);
            const associadoDTO = await associadoService.buscarPorId(parseInt(id));
            console.log('📄 [INIT] Associado:', associadoDTO);
            console.log('🐛 [DEBUG] DTO campos ID:', {
                planoId: associadoDTO.planoId,
                idplano: (associadoDTO as any).idplano,
                categoriaId: associadoDTO.categoriaId,
                vendedorId: associadoDTO.vendedorId,
                vendedorExternoId: associadoDTO.vendedorExternoId,
            });

            // Normaliza IDs
            const planoIdNorm = (associadoDTO as any).planoId ?? (associadoDTO as any).idplano ?? (associadoDTO as any).idPlano;
            const categoriaIdNorm = (associadoDTO as any).categoriaId ?? (associadoDTO as any).idcategoria;
            const vendedorIdNorm = (associadoDTO as any).vendedorId ?? (associadoDTO as any).idvendedor;
            const vendedorExternoIdNorm = (associadoDTO as any).vendedorExternoId ?? (associadoDTO as any).idvendedor_externo;

            // Carregar dados relacionados
            await carregarProdutosHabilitados(parseInt(id));
            await carregarConfiguracoesFaturamento(parseInt(id));

            // ============================================================
            // VÍNCULO DE PLANO — usa listaPlanos LOCAL (não o state)
            // ============================================================
            if (planoIdNorm) {
                console.log('🔎 Plano ID', planoIdNorm, 'entre', listaPlanos.length, 'planos');
                const planoEncontrado = listaPlanos.find(p => idMatch(p.id, planoIdNorm));

                if (planoEncontrado) {
                    setPlanoSelecionado(planoEncontrado);
                    setFormData(prev => ({
                        ...prev,
                        planoId: Number(planoEncontrado.id),
                        planoNome: planoEncontrado.plano,
                        planoValor: planoEncontrado.valor
                    }));
                    console.log('✅ Plano vinculado:', planoEncontrado.plano);
                } else {
                    console.warn('⚠️ Plano ID', planoIdNorm, 'não encontrado. Fallback.');
                    const planoTemp: Plano = {
                        id: Number(planoIdNorm), idtipomodelo: 1,
                        plano: (associadoDTO as any).planoNome || `Plano #${planoIdNorm}`,
                        valor: (associadoDTO as any).planoValor || null, observacao: null
                    };
                    setPlanoSelecionado(planoTemp);
                    setFormData(prev => ({
                        ...prev,
                        planoId: planoTemp.id, planoNome: planoTemp.plano, planoValor: planoTemp.valor
                    }));
                }
            }

            // ============================================================
            // VÍNCULO DE CATEGORIA — usa listaCategorias LOCAL
            // ============================================================
            if (categoriaIdNorm) {
                console.log('🔎 Categoria ID', categoriaIdNorm, 'entre', listaCategorias.length, 'categorias');
                const categoriaEncontrada = listaCategorias.find(c => idMatch(c.id, categoriaIdNorm));

                if (categoriaEncontrada) {
                    setCategoriaSelecionada(categoriaEncontrada);
                    setFormData(prev => ({ ...prev, categoriaId: Number(categoriaEncontrada.id) }));
                    console.log('✅ Categoria vinculada:', categoriaEncontrada.descricao);
                } else {
                    console.warn('⚠️ Categoria ID', categoriaIdNorm, 'não encontrada. Fallback.');
                    const categoriaTemp: Categoria = {
                        id: Number(categoriaIdNorm),
                        descricao: `Categoria #${categoriaIdNorm}`
                    };
                    setCategoriaSelecionada(categoriaTemp);
                    setFormData(prev => ({ ...prev, categoriaId: categoriaTemp.id }));
                }
            }

            // ============================================================
            // VÍNCULO DE VENDEDOR INTERNO — usa listaVendedoresInternos LOCAL
            // ============================================================
            if (vendedorIdNorm) {
                console.log('🔎 Vendedor interno ID', vendedorIdNorm, 'entre', listaVendedoresInternos.length, 'vendedores');
                const encontrado = listaVendedoresInternos.find(v => idMatch(v.id, vendedorIdNorm));
                if (encontrado) {
                    console.log('✅ Vendedor interno vinculado:', encontrado.nomeRazao);
                } else {
                    console.warn('⚠️ Vendedor interno ID', vendedorIdNorm, 'não encontrado. Adicionando à lista.');
                    const novo: VendedorResumoDTO = {
                        id: Number(vendedorIdNorm),
                        nomeRazao: (associadoDTO as any).vendedorNome || `Vendedor #${vendedorIdNorm}`
                    };
                    setVendedoresInternos(prev => [...prev, novo]);
                }
            }

            // ============================================================
            // VÍNCULO DE VENDEDOR EXTERNO
            // ============================================================
            if (vendedorExternoIdNorm) {
                console.log('🔎 Vendedor externo ID', vendedorExternoIdNorm, 'entre', listaVendedoresExternos.length, 'vendedores');
                const encontrado = listaVendedoresExternos.find(v => idMatch(v.id, vendedorExternoIdNorm));
                if (encontrado) {
                    console.log('✅ Vendedor externo vinculado:', encontrado.nomeRazao);
                } else {
                    console.warn('⚠️ Vendedor externo ID', vendedorExternoIdNorm, 'não encontrado. Adicionando à lista.');
                    const novo: VendedorResumoDTO = {
                        id: Number(vendedorExternoIdNorm),
                        nomeRazao: (associadoDTO as any).vendedorExternoNome || `Vendedor #${vendedorExternoIdNorm}`
                    };
                    setVendedoresExternos(prev => [...prev, novo]);
                }
            }

            // ============================================================
            // FORMDATA PRINCIPAL
            // ============================================================
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
                vendedorId: vendedorIdNorm ? Number(vendedorIdNorm) : undefined,
                vendedorExternoId: vendedorExternoIdNorm ? Number(vendedorExternoIdNorm) : undefined,
                planoId: planoIdNorm ? Number(planoIdNorm) : undefined,
                planoNome: associadoDTO.planoNome,
                planoValor: associadoDTO.planoValor,
                categoriaId: categoriaIdNorm ? Number(categoriaIdNorm) : undefined,
                dataInativacao: associadoDTO.dataInativacao,
                dataInicioSuspensao: associadoDTO.dataInicioSuspensao,
                dataFimSuspensao: associadoDTO.dataFimSuspensao,
                motivoInativacao: associadoDTO.motivoInativacao,
                motivoSuspensao: associadoDTO.motivoSuspensao,
                parametroFaturamento: parametroFaturamento,
                produtosHabilitados: produtosHabilitados,
                enderecos: associadoDTO.enderecos && associadoDTO.enderecos.length > 0
                    ? associadoDTO.enderecos.map((e: EnderecoDTO) => ({
                        id: e.id, cep: e.cep || '', logradouro: e.logradouro || '',
                        numero: e.numero || '', complemento: e.complemento || '',
                        bairro: e.bairro || '', cidade: e.cidade || '', estado: e.estado || '',
                        tipoEndereco: (e.tipoEndereco as any) || 'COMERCIAL',
                        ativo: true, principal: e.tipoEndereco === 'COMERCIAL',
                    }))
                    : inicializarTiposPadrao().enderecosPadrao,
                telefones: associadoDTO.telefones && associadoDTO.telefones.length > 0
                    ? associadoDTO.telefones.map((t: TelefoneDTO) => ({
                        id: t.id, ddd: t.ddd || '', numero: t.numero || '',
                        tipoTelefone: (t.tipoTelefone as any) || 'CELULAR',
                        whatsapp: t.whatsapp || false,
                        ativo: t.ativo !== undefined ? t.ativo : true,
                        principal: t.tipoTelefone === 'CELULAR',
                    }))
                    : inicializarTiposPadrao().telefonesPadrao,
                emails: associadoDTO.emails && associadoDTO.emails.length > 0
                    ? associadoDTO.emails.map((e: EmailDTO) => ({
                        id: e.id, email: e.email || '',
                        tipoEmail: (e.tipoEmail as any) || 'COMERCIAL',
                        ativo: e.ativo !== undefined ? e.ativo : true,
                        principal: e.tipoEmail === 'COMERCIAL',
                    }))
                    : inicializarTiposPadrao().emailsPadrao,
            };

            console.log('✅ [INIT] FormData montado');
            setFormData(formDataConvertido);
            console.log('🎉 [INIT] Inicialização concluída');
        } catch (error) {
            console.error('❌ [INIT] Erro:', error);
            showMessage('Erro ao carregar', 'error');
            if (isEditMode) navigate('/associados');
        } finally {
            setLoading(false);
        }
    };

        inicializar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEditMode, navigate]);

  // ==================== FOCO NOS MODAIS ====================

  useEffect(() => {
    if (modalPlanosAberto && planosPesquisaInputRef.current) {
      setTimeout(() => planosPesquisaInputRef.current?.focus(), 100);
    }
  }, [modalPlanosAberto]);

  useEffect(() => {
    if (modalCategoriasAberto && categoriasPesquisaInputRef.current) {
      setTimeout(() => categoriasPesquisaInputRef.current?.focus(), 100);
    }
  }, [modalCategoriasAberto]);

  useEffect(() => {
    if (modalProdutosAberto && produtosPesquisaInputRef.current) {
      setTimeout(() => produtosPesquisaInputRef.current?.focus(), 100);
    }
  }, [modalProdutosAberto]);

  // ==================== CEP ====================

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
      setFormData(prev => ({ ...prev, enderecos: novosEnderecos }));
      showMessage('CEP encontrado com sucesso!', 'success');
    } catch (error) {
      showMessage('Erro ao buscar CEP', 'error');
    }
  };

  // ==================== REPLICAÇÕES ====================

  const handleReplicarEnderecoPrincipal = () => {
    const principal = formData.enderecos.find(e => e.tipoEndereco === 'COMERCIAL');
    if (!principal?.cep?.trim() || !principal?.logradouro?.trim()) {
      showMessage('Endereço COMERCIAL deve ter CEP e Logradouro preenchidos', 'error');
      return;
    }
    const novos = formData.enderecos.map(e => e.tipoEndereco !== 'COMERCIAL' ? {
      ...e, id: e.id,
      cep: principal.cep, logradouro: principal.logradouro, numero: principal.numero,
      complemento: principal.complemento || '', bairro: principal.bairro,
      cidade: principal.cidade, estado: principal.estado
    } : e);
    setFormData(prev => ({ ...prev, enderecos: novos }));
    showMessage('Dados replicados para todos os endereços!', 'success');
  };

  const handleReplicarTelefonePrincipal = () => {
    const principal = formData.telefones.find(t => t.tipoTelefone === 'COMERCIAL');
    if (!principal?.ddd?.trim() || !principal?.numero?.trim()) {
      showMessage('Telefone COMERCIAL deve ter DDD e número', 'error');
      return;
    }
    const novos = formData.telefones.map(t => t.tipoTelefone !== 'COMERCIAL' ? {
      ...t, id: t.id, ddd: principal.ddd, numero: principal.numero,
      whatsapp: t.tipoTelefone === 'CELULAR' ? principal.whatsapp : false
    } : t);
    setFormData(prev => ({ ...prev, telefones: novos }));
    showMessage('Dados replicados para todos os telefones!', 'success');
  };

  const handleReplicarEmailPrincipal = () => {
    const principal = formData.emails.find(e => e.tipoEmail === 'COMERCIAL');
    if (!principal?.email?.trim()) {
      showMessage('E-mail COMERCIAL deve ser preenchido', 'error');
      return;
    }
    const novos = formData.emails.map(e => e.tipoEmail !== 'COMERCIAL' ? { ...e, id: e.id, email: principal.email } : e);
    setFormData(prev => ({ ...prev, emails: novos }));
    showMessage('Dados replicados para todos os e-mails!', 'success');
  };

  // ==================== FATURAMENTO ====================

  const handleSalvarConfiguracaoFaturamento = async (config: ConfiguracaoFaturamento) => {
    try {
      if (configuracaoFaturamentoEditando) {
        if (formData.id) {
          await associadoDefFaturamentoService.atualizar(configuracaoFaturamentoEditando.id, { ...config, associadoId: formData.id }, 'SISTEMA');
          await carregarConfiguracoesFaturamento(formData.id);
        } else {
          setConfiguracoesFaturamento(prev => prev.map(c => c.id === configuracaoFaturamentoEditando.id ? { ...c, ...config } : c));
        }
        showMessage('Configuração atualizada com sucesso!', 'success');
      } else {
        if (formData.id) {
          await associadoDefFaturamentoService.criar({ ...config, associadoId: formData.id }, 'SISTEMA');
          await carregarConfiguracoesFaturamento(formData.id);
        } else {
          const nova: AssociadoDefFaturamentoResumo = { id: Date.now(), associadoId: 0, associadoNome: '', ...config };
          setConfiguracoesFaturamento([...configuracoesFaturamento, nova]);
        }
        showMessage('Configuração adicionada com sucesso!', 'success');
      }
      setModalFaturamentoAberto(false);
      setConfiguracaoFaturamentoEditando(null);
    } catch (error) {
      console.error('❌ Erro ao salvar configuração:', error);
      showMessage('Erro ao salvar configuração de faturamento', 'error');
    }
  };

  const handleEditarConfiguracaoFaturamento = (id: number) => {
    const config = configuracoesFaturamento.find(c => c.id === id);
    if (config) {
      setConfiguracaoFaturamentoEditando(config);
      setModalFaturamentoAberto(true);
    }
  };

  const handleExcluirConfiguracaoFaturamento = async (id: number) => {
    try {
      if (formData.id) {
        await associadoDefFaturamentoService.excluir(id);
        await carregarConfiguracoesFaturamento(formData.id);
      } else {
        setConfiguracoesFaturamento(prev => prev.filter(c => c.id !== id));
      }
      showMessage('Configuração removida com sucesso!', 'success');
    } catch (error) {
      console.error('❌ Erro:', error);
      showMessage('Erro ao excluir configuração', 'error');
    }
  };

  // ==================== PRODUTOS ====================

  const salvarProdutosHabilitados = async (produtos: ProdutoHabilitado[]) => {
    try {
      if (!formData.id) {
        const existentes = produtosHabilitados.map(p => p.id);
        const novos = produtos.filter(p => !existentes.includes(p.id));
        if (novos.length > 0) {
          setProdutosHabilitados([...produtosHabilitados, ...novos]);
          showMessage(`${novos.length} produto(s) adicionado(s) localmente!`, 'success');
        }
        return;
      }

      const paraAPI = produtos.map(p => {
        const original = produtosDisponiveis.find(dp => dp.id === p.id);
        return {
          associadoId: formData.id!,
          produtoId: p.id,
          valorDefinido: p.configuracao?.valorDefinido,
          statusNoProcesso: p.configuracao?.statusNoProcesso || 'A',
          observacao: p.configuracao?.observacao || null,
          tipoProduto: original?.tipo || p.tipo,
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

      const result = await associadoProdutoService.criarEmLote(paraAPI, 'SISTEMA');

      const novos = result.map((item, index) => {
        const original = produtosDisponiveis.find(p => p.id === produtos[index].id);
        return {
          id: item.produtoId, associadoProdutoId: item.id,
          tipo: original?.tipo || produtos[index].tipo,
          produto: original?.nome || produtos[index].produto,
          valor: item.valorDefinido || original?.valor || produtos[index].valor,
          configuracao: {
            valorDefinido: item.valorDefinido, statusNoProcesso: item.statusNoProcesso as 'A' | 'I',
            observacao: item.observacao, tipoEnvioId: item.tipoEnvioId,
            dataAdesao: item.dataAdesao, dataInicio: item.dataInicio, dataFim: item.dataFim,
            dataReinicio: item.dataReinicio, envioPadrao: item.envioPadrao,
            utilizaEnriquecimento: item.utilizaEnriquecimento, deduzirDoPlano: item.deduzirDoPlano
          }
        };
      });

      const existentes = produtosHabilitados.map(p => p.id);
      const reais = novos.filter(p => !existentes.includes(p.id));
      if (reais.length > 0) {
        setProdutosHabilitados([...produtosHabilitados, ...reais]);
        showMessage(`${reais.length} produto(s) adicionado(s) com sucesso!`, 'success');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar produtos:', error);
      throw error;
    }
  };

  const handleSalvarConfiguracaoProduto = async (config: ConfiguracaoProduto) => {
    if (!produtoSelecionadoParaConfig) return;
    try {
      const valorExibido = config.valorDefinido || produtoSelecionadoParaConfig.valor;

      if (configuracaoEditando) {
        setProdutosHabilitados(prev => prev.map(p => p.id === produtoSelecionadoParaConfig.id
          ? { ...p, valor: valorExibido, configuracao: { ...config, valorDefinido: config.valorDefinido } }
          : p));
        if (formData.id) {
          const existente = produtosHabilitados.find(p => p.id === produtoSelecionadoParaConfig.id);
          if (existente?.associadoProdutoId) {
            await associadoProdutoService.atualizar(existente.associadoProdutoId, {
              associadoId: formData.id, produtoId: produtoSelecionadoParaConfig.id,
              valorDefinido: config.valorDefinido, statusNoProcesso: config.statusNoProcesso || 'A',
              observacao: config.observacao || null, tipoProduto: produtoSelecionadoParaConfig.tipo,
              tipoEnvioId: config.tipoEnvioId || null, dataAdesao: config.dataAdesao || null,
              dataInicio: config.dataInicio || null, dataFim: config.dataFim || null,
              dataReinicio: config.dataReinicio || null, envioPadrao: config.envioPadrao || false,
              utilizaEnriquecimento: config.utilizaEnriquecimento || false,
              deduzirDoPlano: config.deduzirDoPlano || false
            }, 'SISTEMA');
          }
        }
        showMessage('Produto atualizado com sucesso!', 'success');
      } else {
        if (produtosHabilitados.some(p => p.id === produtoSelecionadoParaConfig.id)) {
          showMessage('Este produto já está na lista', 'warning');
          return;
        }
        const novo: ProdutoHabilitado = {
          id: produtoSelecionadoParaConfig.id,
          tipo: produtoSelecionadoParaConfig.tipo,
          produto: produtoSelecionadoParaConfig.nome,
          valor: valorExibido,
          configuracao: { ...config, valorDefinido: config.valorDefinido }
        };
        setProdutosHabilitados(prev => [...prev, novo]);

        if (formData.id) {
          const result = await associadoProdutoService.criar({
            associadoId: formData.id, produtoId: produtoSelecionadoParaConfig.id,
            valorDefinido: config.valorDefinido, statusNoProcesso: config.statusNoProcesso || 'A',
            observacao: config.observacao || null, tipoProduto: produtoSelecionadoParaConfig.tipo,
            tipoEnvioId: config.tipoEnvioId || null, dataAdesao: config.dataAdesao || null,
            dataInicio: config.dataInicio || null, dataFim: config.dataFim || null,
            dataReinicio: config.dataReinicio || null, envioPadrao: config.envioPadrao || false,
            utilizaEnriquecimento: config.utilizaEnriquecimento || false,
            deduzirDoPlano: config.deduzirDoPlano || false
          }, 'SISTEMA');
          setProdutosHabilitados(prev => prev.map(p => p.id === produtoSelecionadoParaConfig.id
            ? { ...p, associadoProdutoId: result.id } : p));
        }
        showMessage('Produto adicionado com sucesso!', 'success');
      }
      setModalConfigProdutoAberto(false);
      setProdutoSelecionadoParaConfig(null);
      setConfiguracaoEditando(null);
      setProdutosSelecionados([]);
      setModalProdutosAberto(false);
    } catch (error) {
      console.error('❌ Erro:', error);
      showMessage('Erro ao salvar configuração do produto', 'error');
    }
  };

  const handleEditarProduto = (id: number) => {
    const hab = produtosHabilitados.find(p => p.id === id);
    const orig = produtosDisponiveis.find(p => p.id === id);
    if (!hab || !orig) return;
    const config: ConfiguracaoProduto = {
      valorDefinido: hab.configuracao?.valorDefinido,
      statusNoProcesso: hab.configuracao?.statusNoProcesso || 'A',
      observacao: hab.configuracao?.observacao,
      tipoEnvioId: hab.configuracao?.tipoEnvioId,
      dataAdesao: hab.configuracao?.dataAdesao,
      dataInicio: hab.configuracao?.dataInicio,
      dataFim: hab.configuracao?.dataFim,
      dataReinicio: hab.configuracao?.dataReinicio,
      envioPadrao: hab.configuracao?.envioPadrao,
      utilizaEnriquecimento: hab.configuracao?.utilizaEnriquecimento,
      deduzirDoPlano: hab.configuracao?.deduzirDoPlano
    };
    setProdutoSelecionadoParaConfig(orig);
    setConfiguracaoEditando({ ...hab, configuracao: config });
    setModalConfigProdutoAberto(true);
  };

  const handleExcluirProduto = async (id: number) => {
    try {
      const p = produtosHabilitados.find(x => x.id === id);
      if (formData.id && p?.associadoProdutoId) {
        await associadoProdutoService.excluir(p.associadoProdutoId);
        showMessage('Produto removido com sucesso!', 'success');
      } else {
        showMessage('Produto removido localmente', 'info');
      }
      setProdutosHabilitados(prev => prev.filter(x => x.id !== id));
    } catch (error) {
      console.error('❌ Erro:', error);
      setProdutosHabilitados(prev => prev.filter(x => x.id !== id));
      showMessage('Produto removido localmente', 'info');
    }
  };

  const handleAdicionarProdutosSelecionados = async () => {
    try {
      if (produtosSelecionados.length === 0) {
        showMessage('Nenhum produto selecionado', 'info');
        return;
      }
      if (produtosSelecionados.length === 1) {
        const p = produtosDisponiveis.find(x => x.id === produtosSelecionados[0]);
        if (p) {
          if (produtosHabilitados.some(h => h.id === p.id)) {
            showMessage('Este produto já está na lista', 'warning');
            setProdutosSelecionados([]);
            setModalProdutosAberto(false);
            return;
          }
          setProdutoSelecionadoParaConfig(p);
          setConfiguracaoEditando(null);
          setModalConfigProdutoAberto(true);
        }
        return;
      }
      const novos = produtosDisponiveis
        .filter(p => produtosSelecionados.includes(p.id))
        .filter(p => !produtosHabilitados.some(h => h.id === p.id));
      if (novos.length === 0) {
        showMessage('Todos já estão na lista', 'warning');
        setProdutosSelecionados([]);
        setModalProdutosAberto(false);
        return;
      }
      const paraAdicionar = novos.map(p => ({
        id: p.id, tipo: p.tipo, produto: p.nome, valor: p.valor,
        configuracao: { valorDefinido: p.valor, statusNoProcesso: 'A' as const,
          ...(isProdutoNotificacao(p) ? { envioPadrao: false, utilizaEnriquecimento: false, deduzirDoPlano: false } : {}) }
      }));
      await salvarProdutosHabilitados(paraAdicionar);
      setProdutosSelecionados([]);
      setModalProdutosAberto(false);
    } catch (error) {
      console.error('❌ Erro:', error);
      showMessage('Erro ao adicionar produtos', 'error');
    }
  };

  // ==================== SELEÇÃO ====================

  const handleSelecionarPlano = () => {
    if (planoSelecionado) {
      setFormData(prev => ({
        ...prev,
        planoId: Number(planoSelecionado.id),
        planoNome: planoSelecionado.plano,
        planoValor: planoSelecionado.valor
      }));
      setModalPlanosAberto(false);
      setPlanosPesquisa('');
      showMessage(`Plano "${planoSelecionado.plano}" selecionado com sucesso!`, 'success');
    }
  };

  const handleSelecionarCategoria = () => {
    if (categoriaSelecionada) {
      setFormData(prev => ({ ...prev, categoriaId: Number(categoriaSelecionada.id) }));
      setModalCategoriasAberto(false);
      setCategoriasPesquisa('');
      showMessage(`Categoria "${categoriaSelecionada.descricao}" selecionada com sucesso!`, 'success');
    }
  };

  const handleLimparPlano = () => {
    setFormData(prev => ({ ...prev, planoId: undefined, planoNome: undefined, planoValor: undefined }));
    setPlanoSelecionado(null);
    showMessage('Plano removido', 'info');
  };

  const handleLimparCategoria = () => {
    setFormData(prev => ({ ...prev, categoriaId: undefined }));
    setCategoriaSelecionada(null);
    showMessage('Categoria removida', 'info');
  };

  // ==================== VALIDAÇÃO ====================

  const validarFormulario = (): boolean => {
    const novos: Record<string, string> = {};

    if (!formData.cnpjCpf?.trim()) novos.cnpjCpf = '❌ CPF/CNPJ é obrigatório';
    else {
      const limpo = normalizarCnpj(formData.cnpjCpf);
      if (formData.tipoPessoa === 'F') {
        if (limpo.length !== 11) novos.cnpjCpf = '❌ CPF deve ter 11 dígitos';
        else if (!/^\d+$/.test(limpo)) novos.cnpjCpf = '❌ CPF inválido';
      } else {
        if (limpo.length !== 14) novos.cnpjCpf = '❌ CNPJ deve ter 14 caracteres';
        else {
          const dataLimite = new Date('2026-07-01');
          if (new Date() >= dataLimite && !validarCnpj(limpo)) novos.cnpjCpf = '❌ CNPJ inválido';
        }
      }
    }

    if (!formData.nomeRazao?.trim()) novos.nomeRazao = '❌ Nome/Razão Social é obrigatório';
    if (formData.tipoPessoa === 'J' && !formData.nomeFantasia?.trim()) {
      novos.nomeFantasia = '❌ Nome Fantasia obrigatório para PJ';
    }

    const endCom = formData.enderecos.find(e => e.tipoEndereco === 'COMERCIAL');
    if (!endCom) novos.endereco = '❌ Endereço COMERCIAL obrigatório';
    else if (!endCom.cep?.trim()) novos.endereco = '❌ Endereço COMERCIAL: CEP obrigatório';
    else if (!endCom.logradouro?.trim()) novos.endereco = '❌ Endereço COMERCIAL: Logradouro obrigatório';

    const telCom = formData.telefones.find(t => t.tipoTelefone === 'COMERCIAL');
    if (!telCom) novos.telefone = '❌ Telefone COMERCIAL obrigatório';
    else if (!telCom.ddd?.trim()) novos.telefone = '❌ Telefone COMERCIAL: DDD obrigatório';
    else if (!telCom.numero?.trim()) novos.telefone = '❌ Telefone COMERCIAL: Número obrigatório';

    const mailCom = formData.emails.find(e => e.tipoEmail === 'COMERCIAL');
    if (!mailCom) novos.email = '❌ E-mail COMERCIAL obrigatório';
    else if (!mailCom.email?.trim()) novos.email = '❌ E-mail COMERCIAL deve ser preenchido';
    else if (!mailCom.email.includes('@') || !mailCom.email.includes('.')) novos.email = '❌ E-mail COMERCIAL inválido';

    setErros(novos);
    if (Object.keys(novos).length > 0) {
      showMessage(`⚠️ ${Object.keys(novos).length} campo(s) obrigatório(s)`, 'error');
    }
    return Object.keys(novos).length === 0;
  };

  // ==================== HANDLERS ====================

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let valorFinal: any = value;
    if (type === 'number') valorFinal = value === '' ? undefined : parseFloat(value);
    else if (type === 'checkbox') valorFinal = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: valorFinal }));
    if (erros[name]) setErros(prev => ({ ...prev, [name]: '' }));
  };

  const handleChangeNested = (
    section: 'enderecos' | 'telefones' | 'emails',
    index: number, field: string, value: any
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
  };

  const handleStatusChange = (novoStatus: 'A' | 'I' | 'S') => {
    setFormData(prev => {
      const updated = { ...prev, status: novoStatus };
      if (novoStatus === 'A') {
        updated.dataInativacao = undefined; updated.motivoInativacao = undefined;
        updated.dataInicioSuspensao = undefined; updated.dataFimSuspensao = undefined;
        updated.motivoSuspensao = undefined;
      } else if (novoStatus === 'I') {
        updated.dataInativacao = new Date().toISOString().split('T')[0];
        updated.dataInicioSuspensao = undefined; updated.dataFimSuspensao = undefined;
        updated.motivoSuspensao = undefined;
      } else if (novoStatus === 'S') {
        updated.dataInicioSuspensao = new Date().toISOString().split('T')[0];
        const dataFim = new Date(); dataFim.setMonth(dataFim.getMonth() + 1);
        updated.dataFimSuspensao = dataFim.toISOString().split('T')[0];
        updated.dataInativacao = undefined; updated.motivoInativacao = undefined;
      }
      return updated;
    });
  };

  // ==================== SUBMIT ====================

  const converterParaDTO = (data: AssociadoFormData): AssociadoDTO => {
    const emptyToNull = (v: any) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) ? null : v;
    const parseId = (v: any): number | null => {
      if (v === undefined || v === null) return null;
      if (typeof v === 'string') { const p = parseInt(v, 10); return isNaN(p) ? null : p; }
      if (typeof v === 'number') return v;
      return null;
    };
    return {
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
      enderecos: (data.enderecos || []).map(e => ({
        id: e.id, cep: e.cep?.trim() || '', logradouro: e.logradouro?.trim() || '',
        numero: e.numero?.trim() || '', complemento: e.complemento?.trim() || '',
        bairro: e.bairro?.trim() || '', cidade: e.cidade?.trim() || '',
        estado: e.estado?.trim() || '', tipoEndereco: e.tipoEndereco || 'COMERCIAL'
      })),
      telefones: (data.telefones || []).map(t => ({
        id: t.id, ddd: t.ddd?.trim() || '', numero: t.numero?.trim() || '',
        tipoTelefone: t.tipoTelefone || 'CELULAR', whatsapp: t.whatsapp || false,
        ativo: t.ativo !== false
      })),
      emails: (data.emails || []).map(e => ({
        id: e.id, email: e.email?.trim() || '', tipoEmail: e.tipoEmail || 'COMERCIAL',
        ativo: e.ativo !== false
      }))
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    setSalvando(true);
    try {
      const dto = converterParaDTO(formData);
      if (isEditMode && formData.id) {
        await associadoService.atualizar(formData.id, dto);
        const semId = produtosHabilitados.filter(p => !p.associadoProdutoId);
        if (semId.length > 0) await salvarProdutosHabilitados(semId);
        showMessage('Associado atualizado com sucesso!', 'success');
      } else {
        const novo = await associadoService.criar(dto);
        if (produtosHabilitados.length > 0 && novo?.id) {
          try {
            const paraAPI = produtosHabilitados.map(p => ({
              associadoId: novo.id, produtoId: p.id,
              valorDefinido: p.configuracao?.valorDefinido,
              statusNoProcesso: p.configuracao?.statusNoProcesso || 'A',
              observacao: p.configuracao?.observacao || null,
              tipoProduto: p.tipo, tipoEnvioId: p.configuracao?.tipoEnvioId || null,
              dataAdesao: p.configuracao?.dataAdesao || null,
              dataInicio: p.configuracao?.dataInicio || null,
              dataFim: p.configuracao?.dataFim || null,
              dataReinicio: p.configuracao?.dataReinicio || null,
              envioPadrao: p.configuracao?.envioPadrao || false,
              utilizaEnriquecimento: p.configuracao?.utilizaEnriquecimento || false,
              deduzirDoPlano: p.configuracao?.deduzirDoPlano || false
            }));
            const result = await associadoProdutoService.criarEmLote(paraAPI, 'SISTEMA');
            setProdutosHabilitados(produtosHabilitados.map((p, i) => ({ ...p, associadoProdutoId: result[i]?.id })));
            showMessage('Associado e produtos criados com sucesso!', 'success');
          } catch (err) {
            console.error('❌ Erro ao adicionar produtos:', err);
            showMessage('Associado criado, mas houve erro nos produtos', 'warning');
          }
        } else {
          showMessage('Associado criado com sucesso!', 'success');
        }
        if (configuracoesFaturamento.length > 0 && novo?.id) {
          try {
            await associadoDefFaturamentoService.criarEmLote(
              configuracoesFaturamento.map(c => ({
                associadoId: novo.id, planoId: c.planoId, valorDef: c.valorDef,
                diaEmissao: c.diaEmissao, diaVencimento: c.diaVencimento, observacao: c.observacao
              })), 'SISTEMA'
            );
          } catch (err) { console.error('❌ Erro faturamento:', err); }
        }
      }
      setTimeout(() => navigate('/associados'), 2000);
    } catch (error: any) {
      console.error('❌ Erro ao salvar:', error);
      const msg = error.response?.data?.message || error.response?.data?.erro
        || `Erro ${error.response?.status}: ${error.response?.statusText}` || error.message;
      showMessage(msg || 'Erro ao salvar associado', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = () => navigate('/associados');

  // ==================== COMPONENTES ====================

  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700">Carregando...</p>
      </div>
    </div>
  );

  const BreadCrumbInternal = () => (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <button onClick={() => navigate('/associados')} className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
            <svg className="w-3 h-3 mr-2.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z"/>
            </svg>
            Associados
          </button>
        </li>
        <li aria-current="page">
          <div className="flex items-center">
            <svg className="w-3 h-3 mx-1 text-gray-400" fill="none" viewBox="0 0 6 10">
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

  // ==================== MODAIS ====================

  const ModalPlanos = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Selecionar Plano</h3>
            <p className="text-sm text-gray-600 mt-1">Selecione um plano para este associado</p>
          </div>
          <button onClick={() => setModalPlanosAberto(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6">
          <input
            ref={planosPesquisaInputRef} type="text" value={planosPesquisa}
            onChange={(e) => setPlanosPesquisa(e.target.value)}
            placeholder="Pesquisar planos..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sel.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {planosDisponiveis
                  .filter(p => p.plano.toLowerCase().includes(planosPesquisa.toLowerCase())
                    || (p.valor && p.valor.toString().includes(planosPesquisa))
                    || p.id.toString().includes(planosPesquisa))
                  .map((plano) => (
                    <tr
                      key={plano.id}
                      className={`hover:bg-gray-50 cursor-pointer ${idMatch(planoSelecionado?.id, plano.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => setPlanoSelecionado(plano)}
                    >
                      <td className="px-6 py-4"><input type="radio" checked={idMatch(planoSelecionado?.id, plano.id)} onChange={() => setPlanoSelecionado(plano)} className="h-4 w-4 text-blue-600"/></td>
                      <td className="px-6 py-4 text-sm text-gray-900">{plano.id}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{plano.plano}</div>
                        {plano.observacao && <div className="text-sm text-gray-500">{plano.observacao}</div>}
                      </td>
                      <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Tipo {plano.idtipomodelo}</span></td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {plano.valor ? plano.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <span className="text-gray-400">-</span>}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {planoSelecionado && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-blue-800">Selecionado:</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">{planoSelecionado.plano}</span>
                    {planoSelecionado.valor && <span className="ml-2 font-semibold">- {planoSelecionado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>}
                  </p>
                </div>
                <button onClick={() => setPlanoSelecionado(null)} className="text-blue-600 hover:text-blue-800 text-sm">Limpar</button>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">{planosDisponiveis.length} plano(s) disponível(is)</div>
            <div className="flex space-x-3">
              <button onClick={() => setModalPlanosAberto(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSelecionarPlano} disabled={!planoSelecionado} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Selecionar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ModalCategorias = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Selecionar Categoria</h3>
            <p className="text-sm text-gray-600 mt-1">Selecione uma categoria</p>
          </div>
          <button onClick={() => setModalCategoriasAberto(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6">
          <input
            ref={categoriasPesquisaInputRef} type="text" value={categoriasPesquisa}
            onChange={(e) => setCategoriasPesquisa(e.target.value)}
            placeholder="Pesquisar categorias..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sel.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoriasDisponiveis
                  .filter(c => c.descricao.toLowerCase().includes(categoriasPesquisa.toLowerCase()) || c.id.toString().includes(categoriasPesquisa))
                  .map((categoria) => (
                    <tr
                      key={categoria.id}
                      className={`hover:bg-gray-50 cursor-pointer ${idMatch(categoriaSelecionada?.id, categoria.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => setCategoriaSelecionada(categoria)}
                    >
                      <td className="px-6 py-4"><input type="radio" checked={idMatch(categoriaSelecionada?.id, categoria.id)} onChange={() => setCategoriaSelecionada(categoria)} className="h-4 w-4 text-blue-600"/></td>
                      <td className="px-6 py-4 text-sm text-gray-900">{categoria.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{categoria.descricao}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {categoriaSelecionada && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-blue-800">Selecionada:</h4>
                  <p className="text-sm text-blue-700 mt-1 font-medium">{categoriaSelecionada.descricao}</p>
                </div>
                <button onClick={() => setCategoriaSelecionada(null)} className="text-blue-600 hover:text-blue-800 text-sm">Limpar</button>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">{categoriasDisponiveis.length} categoria(s) disponível(is)</div>
            <div className="flex space-x-3">
              <button onClick={() => setModalCategoriasAberto(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSelecionarCategoria} disabled={!categoriaSelecionada} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Selecionar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ModalProdutos = () => (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Adicionar Produtos</h3>
            <p className="text-sm text-gray-600 mt-1">Selecione os produtos</p>
          </div>
          <button onClick={() => setModalProdutosAberto(false)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="p-6">
          <input
            ref={produtosPesquisaInputRef} type="text" value={produtosPesquisa}
            onChange={(e) => setProdutosPesquisa(e.target.value)}
            placeholder="Pesquisar produtos..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[50vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sel.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosDisponiveis
                  .filter(p => p.nome.toLowerCase().includes(produtosPesquisa.toLowerCase())
                    || p.codigo.toLowerCase().includes(produtosPesquisa.toLowerCase())
                    || p.tipo.toLowerCase().includes(produtosPesquisa.toLowerCase())
                    || p.descricao.toLowerCase().includes(produtosPesquisa.toLowerCase()))
                  .map((produto) => (
                    <tr key={produto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={produtosSelecionados.includes(produto.id)}
                          onChange={(e) => {
                            if (e.target.checked) setProdutosSelecionados([...produtosSelecionados, produto.id]);
                            else setProdutosSelecionados(produtosSelecionados.filter(id => id !== produto.id));
                          }}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{produto.codigo}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                        <div className="text-sm text-gray-500">{produto.descricao}</div>
                      </td>
                      <td className="px-6 py-4"><span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{produto.tipo}</span></td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">{produtosSelecionados.length} selecionado(s)</div>
            <div className="flex space-x-3">
              <button onClick={() => setModalProdutosAberto(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleAdicionarProdutosSelecionados} disabled={produtosSelecionados.length === 0} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">Adicionar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== ABAS ====================

  const Abas = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex flex-wrap space-x-1">
        {[
          { key: 'dados-cadastrais', label: '📋 Dados Cadastrais' },
          { key: 'relacionamento', label: '👥 Relacionamento' },
          { key: 'enderecos-contatos', label: '📍 Endereços e Contatos' },
          { key: 'parametro-faturamento', label: '💰 Parâmetro Faturamento' },
          { key: 'produtos-habilitados', label: '📦 Produtos Habilitados' },
        ].map(tab => (
          <button
            key={tab.key} type="button" onClick={() => setAbaAtiva(tab.key)}
            className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
              abaAtiva === tab.key ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const SubAbasEnderecos = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        {[
          { key: 'COMERCIAL', label: '🏢 Comercial' },
          { key: 'COBRANCA', label: '💰 Cobrança' },
          { key: 'RESIDENCIAL', label: '🏠 Residencial' },
          { key: 'ENTREGA', label: '🚚 Entrega' },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setSubAbaEnderecos(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-all ${subAbaEnderecos === tab.key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const SubAbasTelefones = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        {[
          { key: 'COMERCIAL', label: '🏢 Comercial' },
          { key: 'CELULAR', label: '📱 Celular' },
          { key: 'RESIDENCIAL', label: '🏠 Residencial' },
          { key: 'FAX', label: '📠 Fax' },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setSubAbaTelefones(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-all ${subAbaTelefones === tab.key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  const SubAbasEmails = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-1">
        {[
          { key: 'COMERCIAL', label: '🏢 Comercial' },
          { key: 'PESSOAL', label: '👤 Pessoal' },
          { key: 'COBRANCA', label: '💰 Cobrança' },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setSubAbaEmails(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-all ${subAbaEmails === tab.key ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  // ==================== RENDERIZAÇÃO DAS ABAS ====================

  const renderDadosCadastrais = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-1 h-6 bg-blue-600 rounded"></div>
        <h2 className="text-lg font-semibold text-gray-800">Dados Cadastrais</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Pessoa *</label>
          <select name="tipoPessoa" value={formData.tipoPessoa} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="F">Pessoa Física</option>
            <option value="J">Pessoa Jurídica</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{formData.tipoPessoa === 'F' ? 'CPF' : 'CNPJ'} *</label>
          <input type="text" name="cnpjCpf" value={formData.cnpjCpf} onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.cnpjCpf ? 'border-red-500' : 'border-gray-300'}`}
            maxLength={formData.tipoPessoa === 'F' ? 14 : 18}/>
          {erros.cnpjCpf && <p className="mt-1 text-sm text-red-600">{erros.cnpjCpf}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">{formData.tipoPessoa === 'F' ? 'Nome Completo' : 'Razão Social'} *</label>
          <input type="text" name="nomeRazao" value={formData.nomeRazao} onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.nomeRazao ? 'border-red-500' : 'border-gray-300'}`}/>
          {erros.nomeRazao && <p className="mt-1 text-sm text-red-600">{erros.nomeRazao}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome Fantasia {formData.tipoPessoa === 'J' && '*'}</label>
          <input type="text" name="nomeFantasia" value={formData.nomeFantasia || ''} onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${erros.nomeFantasia ? 'border-red-500' : 'border-gray-300'}`}/>
          {erros.nomeFantasia && <p className="mt-1 text-sm text-red-600">{erros.nomeFantasia}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data de Filiação</label>
          <input type="date" name="dataFiliacao" value={formData.dataFiliacao || ''} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="flex items-center gap-3">
            <select name="status" value={formData.status} onChange={(e) => handleStatusChange(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="A">Ativo</option>
              <option value="I">Inativo</option>
              <option value="S">Suspenso</option>
            </select>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(formData.status)}`}>{getStatusText(formData.status)}</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Código SPC</label>
          <input type="text" name="codigoSpc" value={formData.codigoSpc || ''} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Código RM</label>
          <input type="text" name="codigoRm" value={formData.codigoRm || ''} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Valor Plano R$</label>
          <input type="number" name="faturamentoMinimo" value={formData.faturamentoMinimo || ''} onChange={handleChange} step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
      </div>
      {(formData.status === 'I' || formData.status === 'S') && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-orange-600 rounded"></div>
            <h3 className="text-md font-semibold text-gray-800">{formData.status === 'I' ? 'Inativação' : 'Suspensão'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.status === 'I' ? 'Data de Inativação' : 'Data de Início da Suspensão'} *
              </label>
              <input type="date" name={formData.status === 'I' ? 'dataInativacao' : 'dataInicioSuspensao'}
                value={formData.status === 'I' ? (formData.dataInativacao || '') : (formData.dataInicioSuspensao || '')}
                onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            {formData.status === 'S' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data de Fim da Suspensão *</label>
                <input type="date" name="dataFimSuspensao" value={formData.dataFimSuspensao || ''} onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.status === 'I' ? 'Motivo da Inativação' : 'Motivo da Suspensão'} *
              </label>
              <textarea name={formData.status === 'I' ? 'motivoInativacao' : 'motivoSuspensao'}
                value={formData.status === 'I' ? (formData.motivoInativacao || '') : (formData.motivoSuspensao || '')}
                onChange={handleChange} rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor Interno</label>
          <select name="vendedorId" value={formData.vendedorId != null ? String(formData.vendedorId) : ''} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione um vendedor interno...</option>
            {vendedoresInternos.map(v => (
              <option key={v.id} value={String(v.id)}>{v.nomeRazao}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">{vendedoresInternos.length} vendedor(es) disponível(is)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Vendedor Externo</label>
          <select name="vendedorExternoId" value={formData.vendedorExternoId != null ? String(formData.vendedorExternoId) : ''} onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Selecione um vendedor externo...</option>
            {vendedoresExternos.map(v => (
              <option key={v.id} value={String(v.id)}>{v.nomeRazao}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">{vendedoresExternos.length} vendedor(es) disponível(is)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Plano</label>
          <button type="button" onClick={() => setModalPlanosAberto(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between">
            <span className="text-gray-700">
              {planoSelecionado
                ? `${planoSelecionado.plano}${planoSelecionado.valor ? ' - ' + planoSelecionado.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}`
                : 'Selecionar plano...'}
            </span>
            <span className="text-gray-400">🔍</span>
          </button>
          <p className="mt-1 text-xs text-gray-500">{planosDisponiveis.length} planos disponíveis</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
          <button type="button" onClick={() => setModalCategoriasAberto(true)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between">
            <span className="text-gray-700">{categoriaSelecionada ? categoriaSelecionada.descricao : 'Selecionar categoria...'}</span>
            <span className="text-gray-400">🔍</span>
          </button>
          <p className="mt-1 text-xs text-gray-500">{categoriasDisponiveis.length} categorias disponíveis</p>
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
            <h3 className="text-md font-semibold text-gray-800">Endereços</h3>
            <button type="button" onClick={handleReplicarEnderecoPrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">📋 Replicar do Comercial</button>
          </div>
          <SubAbasEnderecos />
          {renderEnderecos()}
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-800">Telefones</h3>
            <button type="button" onClick={handleReplicarTelefonePrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">📋 Replicar do Comercial</button>
          </div>
          <SubAbasTelefones />
          {renderTelefones()}
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-800">E-mails</h3>
            <button type="button" onClick={handleReplicarEmailPrincipal}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">📋 Replicar do Comercial</button>
          </div>
          <SubAbasEmails />
          {renderEmails()}
        </div>
      </div>
    </div>
  );

  const renderEnderecos = () => {
    const enderecosDoTipo = formData.enderecos.filter(e => e.tipoEndereco === subAbaEnderecos);
    return (
      <div>
        {enderecosDoTipo.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">Nenhum endereço {subAbaEnderecos.toLowerCase()}</p>
            <button type="button"
              onClick={() => {
                const novo: Endereco = { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: subAbaEnderecos, ativo: true, principal: false };
                setFormData(prev => ({ ...prev, enderecos: [...prev.enderecos, novo] }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto flex items-center gap-2">➕ Adicionar</button>
          </div>
        ) : (
          <div className="space-y-4">
            {enderecosDoTipo.map((endereco) => {
              const idxGlobal = formData.enderecos.findIndex(e => e.id === endereco.id || (e.cep === endereco.cep && e.logradouro === endereco.logradouro && e.numero === endereco.numero));
              return (
                <div key={idxGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-800">Endereço {subAbaEnderecos}</h3>
                    {enderecosDoTipo.length > 1 && (
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, enderecos: prev.enderecos.filter((_, i) => i !== idxGlobal) }))}
                        className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">✕ Remover</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CEP *</label>
                      <div className="flex gap-2">
                        <input type="text" value={endereco.cep} onChange={(e) => handleChangeNested('enderecos', idxGlobal, 'cep', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="00000-000"/>
                        <button type="button" onClick={() => handleBuscarCEP(idxGlobal)} disabled={buscandoCEP}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm disabled:opacity-50">{buscandoCEP ? '...' : 'Buscar'}</button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro *</label>
                      <input type="text" value={endereco.logradouro} onChange={(e) => handleChangeNested('enderecos', idxGlobal, 'logradouro', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                      <input type="text" value={endereco.numero} onChange={(e) => handleChangeNested('enderecos', idxGlobal, 'numero', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                      <input type="text" value={endereco.complemento || ''} onChange={(e) => handleChangeNested('enderecos', idxGlobal, 'complemento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                      <input type="text" value={endereco.bairro} onChange={(e) => handleChangeNested('enderecos', idxGlobal, 'bairro', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                      <input type="text" value={endereco.cidade} onChange={(e) => handleChangeNested('enderecos', idxGlobal, 'cidade', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">UF *</label>
                      <input type="text" value={endereco.estado} onChange={(e) => handleChangeNested('enderecos', idxGlobal, 'estado', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={2}/>
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button"
              onClick={() => {
                const novo: Endereco = { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '', tipoEndereco: subAbaEnderecos, ativo: true, principal: false };
                setFormData(prev => ({ ...prev, enderecos: [...prev.enderecos, novo] }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2">
              ➕ Adicionar outro endereço {subAbaEnderecos}
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
            <p className="text-gray-500 mb-4">Nenhum telefone {subAbaTelefones.toLowerCase()}</p>
            <button type="button"
              onClick={() => {
                const novo: Telefone = { ddd: '', numero: '', tipoTelefone: subAbaTelefones, whatsapp: subAbaTelefones === 'CELULAR', ativo: true, principal: false };
                setFormData(prev => ({ ...prev, telefones: [...prev.telefones, novo] }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto flex items-center gap-2">➕ Adicionar</button>
          </div>
        ) : (
          <div className="space-y-4">
            {telefonesDoTipo.map((telefone) => {
              const idxGlobal = formData.telefones.findIndex(t => t.id === telefone.id || (t.ddd === telefone.ddd && t.numero === telefone.numero));
              return (
                <div key={idxGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-800">Telefone {subAbaTelefones}</h3>
                    {telefonesDoTipo.length > 1 && (
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, telefones: prev.telefones.filter((_, i) => i !== idxGlobal) }))}
                        className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">✕ Remover</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">DDD *</label>
                      <input type="text" value={telefone.ddd} onChange={(e) => handleChangeNested('telefones', idxGlobal, 'ddd', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" maxLength={2}/>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                      <input type="text" value={telefone.numero} onChange={(e) => handleChangeNested('telefones', idxGlobal, 'numero', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    {subAbaTelefones === 'CELULAR' && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={telefone.whatsapp} onChange={(e) => handleChangeNested('telefones', idxGlobal, 'whatsapp', e.target.checked)} className="h-4 w-4 text-green-600 rounded"/>
                        <label className="text-sm text-gray-700">WhatsApp</label>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={telefone.ativo} onChange={(e) => handleChangeNested('telefones', idxGlobal, 'ativo', e.target.checked)} className="h-4 w-4 text-green-600 rounded"/>
                      <label className="text-sm text-gray-700">Ativo</label>
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button"
              onClick={() => {
                const novo: Telefone = { ddd: '', numero: '', tipoTelefone: subAbaTelefones, whatsapp: subAbaTelefones === 'CELULAR', ativo: true, principal: false };
                setFormData(prev => ({ ...prev, telefones: [...prev.telefones, novo] }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2">
              ➕ Adicionar outro telefone {subAbaTelefones}
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
            <p className="text-gray-500 mb-4">Nenhum e-mail {subAbaEmails.toLowerCase()}</p>
            <button type="button"
              onClick={() => {
                const novo: Email = { email: '', tipoEmail: subAbaEmails, ativo: true, principal: false };
                setFormData(prev => ({ ...prev, emails: [...prev.emails, novo] }));
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mx-auto flex items-center gap-2">➕ Adicionar</button>
          </div>
        ) : (
          <div className="space-y-4">
            {emailsDoTipo.map((email) => {
              const idxGlobal = formData.emails.findIndex(e => e.id === email.id || e.email === email.email);
              return (
                <div key={idxGlobal} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-gray-800">E-mail {subAbaEmails}</h3>
                    {emailsDoTipo.length > 1 && (
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, emails: prev.emails.filter((_, i) => i !== idxGlobal) }))}
                        className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm">✕ Remover</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                      <input type="email" value={email.email} onChange={(e) => handleChangeNested('emails', idxGlobal, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={email.ativo} onChange={(e) => handleChangeNested('emails', idxGlobal, 'ativo', e.target.checked)} className="h-4 w-4 text-green-600 rounded"/>
                      <label className="text-sm text-gray-700">Ativo</label>
                    </div>
                  </div>
                </div>
              );
            })}
            <button type="button"
              onClick={() => {
                const novo: Email = { email: '', tipoEmail: subAbaEmails, ativo: true, principal: false };
                setFormData(prev => ({ ...prev, emails: [...prev.emails, novo] }));
              }}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 flex items-center justify-center gap-2">
              ➕ Adicionar outro e-mail {subAbaEmails}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderParametroFaturamento = () => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-indigo-600 rounded"></div>
          <h2 className="text-lg font-semibold text-gray-800">Configurações de Faturamento</h2>
        </div>
        <button type="button" onClick={() => { setConfiguracaoFaturamentoEditando(null); setModalFaturamentoAberto(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">➕ Nova</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia Emissão</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia Vencimento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plano</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observação</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {configuracoesFaturamento.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma configuração.</td></tr>
            ) : configuracoesFaturamento.map(config => (
              <tr key={config.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{config.diaEmissao}º dia</td>
                <td className="px-6 py-4 text-sm text-gray-900">{config.diaVencimento}º dia</td>
                <td className="px-6 py-4 text-sm text-gray-900">{config.planoNome || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{config.valorDef ? `R$ ${config.valorDef.toFixed(2)}` : '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{config.observacao || '-'}</td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => handleEditarConfiguracaoFaturamento(config.id)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">✏️</button>
                    <button type="button" onClick={() => handleExcluirConfiguracaoFaturamento(config.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <button type="button" onClick={() => { setModalProdutosAberto(true); setProdutosSelecionados([]); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">➕ Adicionar Produto</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {produtosHabilitados.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum produto habilitado.</td></tr>
            ) : produtosHabilitados.map(produto => (
              <tr key={produto.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">{produto.tipo}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{produto.produto}</td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {produto.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => handleEditarProduto(produto.id)} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50">✏️</button>
                    <button type="button" onClick={() => handleExcluirProduto(produto.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'dados-cadastrais': return renderDadosCadastrais();
      case 'relacionamento': return renderRelacionamento();
      case 'enderecos-contatos': return renderEnderecosContatos();
      case 'parametro-faturamento': return renderParametroFaturamento();
      case 'produtos-habilitados': return renderProdutosHabilitados();
      default: return renderDadosCadastrais();
    }
  };

  // ==================== RENDER ====================

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BreadCrumbInternal />

      {mensagem && (
        <div className={`mb-6 p-4 rounded-lg ${
          mensagem.tipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200'
          : mensagem.tipo === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
          : mensagem.tipo === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200'
          : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <span className="mr-2">
            {mensagem.tipo === 'success' ? '✅' : mensagem.tipo === 'warning' ? '⚠️' : mensagem.tipo === 'info' ? 'ℹ️' : '❌'}
          </span>
          <span>{mensagem.texto}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Editar Associado' : 'Novo Associado'}</h1>
            <p className="text-gray-600 mt-1">{isEditMode ? 'Atualize as informações' : 'Preencha os dados'}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCancelar} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">✕ Cancelar</button>
            <button onClick={handleSubmit} disabled={salvando} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">💾 {salvando ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Abas />
          {renderConteudoAba()}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button type="button" onClick={handleCancelar} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2">✕ Cancelar</button>
            <button type="submit" disabled={salvando} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">💾 {salvando ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>

      {modalProdutosAberto && <ModalProdutos />}
      {modalPlanosAberto && <ModalPlanos />}
      {modalCategoriasAberto && <ModalCategorias />}

      {modalConfigProdutoAberto && produtoSelecionadoParaConfig && (
        <ModalConfigurarProduto
          produto={produtoSelecionadoParaConfig}
          aberto={modalConfigProdutoAberto}
          onFechar={() => { setModalConfigProdutoAberto(false); setProdutoSelecionadoParaConfig(null); setConfiguracaoEditando(null); }}
          onSalvar={handleSalvarConfiguracaoProduto}
          valorPadrao={produtoSelecionadoParaConfig.valor}
          configuracaoInicial={configuracaoEditando?.configuracao}
        />
      )}

      <ModalConfigurarFaturamento
        aberto={modalFaturamentoAberto}
        onFechar={() => { setModalFaturamentoAberto(false); setConfiguracaoFaturamentoEditando(null); }}
        onSalvar={handleSalvarConfiguracaoFaturamento}
        configuracaoInicial={configuracaoFaturamentoEditando || undefined}
        diasExistentes={configuracoesFaturamento.map(c => c.diaEmissao)}
      />
    </div>
  );
};

export default AssociadoForm;