import api from './api';
import { AssociadoImportacaoLinha, ResultadoImportacao } from '../types/associadoImportacao';
import { associadoService } from './associadoService';
import { vendedorService } from './vendedorService';
import { associadoOpcoes } from './associadoService';

// Funções de validação
const validarCnpjCpf = (valor: string, tipo: 'F' | 'J'): boolean => {
  const apenasNumeros = valor.replace(/\D/g, '');
  
  if (tipo === 'F') {
    // Validação básica de CPF
    if (apenasNumeros.length !== 11) return false;
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(apenasNumeros)) return false;
    return true;
  } else {
    // Validação básica de CNPJ
    if (apenasNumeros.length !== 14) return false;
    if (/^(\d)\1+$/.test(apenasNumeros)) return false;
    return true;
  }
};

const validarEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
  return regex.test(email);
};

const validarTelefone = (ddd: string, numero: string): boolean => {
  const dddNum = parseInt(ddd);
  if (isNaN(dddNum) || dddNum < 11 || dddNum > 99) return false;
  
  const apenasNumeros = numero.replace(/\D/g, '');
  return apenasNumeros.length >= 8 && apenasNumeros.length <= 9;
};

const normalizarCnpjCpf = (valor: string): string => {
  return valor.replace(/\D/g, '');
};

export const associadoImportacaoService = {
  /**
   * Parse do arquivo CSV/Excel para o formato de importação
   */
  async parseArquivo(arquivo: File): Promise<AssociadoImportacaoLinha[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const conteudo = e.target?.result as string;
        const linhas = conteudo.split(/\r?\n/);
        const cabecalho = linhas[0].split(';');
        
        const resultados: AssociadoImportacaoLinha[] = [];
        
        for (let i = 1; i < linhas.length; i++) {
          if (!linhas[i].trim()) continue;
          
          const valores = linhas[i].split(';');
          const linha: AssociadoImportacaoLinha = {
            linha: i + 1,
            tipoPessoa: 'F',
            cnpjCpf: '',
            nomeRazao: '',
            erros: []
          };
          
          // Mapear campos baseado no cabeçalho
          cabecalho.forEach((campo, idx) => {
            const valor = valores[idx]?.trim() || '';
            switch (campo.toLowerCase()) {
              case 'tipo_pessoa':
              case 'tipo':
                linha.tipoPessoa = valor.toUpperCase() === 'J' ? 'J' : 'F';
                break;
              case 'cnpj_cpf':
              case 'documento':
                linha.cnpjCpf = valor;
                break;
              case 'nome_razao':
              case 'nome':
                linha.nomeRazao = valor;
                break;
              case 'nome_fantasia':
                linha.nomeFantasia = valor;
                break;
              case 'codigo_vendedor':
                linha.codigoVendedor = valor;
                break;
              case 'codigo_vendedor_externo':
                linha.codigoVendedorExterno = valor;
                break;
              case 'codigo_plano':
                linha.codigoPlano = valor;
                break;
              case 'codigo_categoria':
                linha.codigoCategoria = valor;
                break;
              case 'codigo_spc':
                linha.codigoSpc = valor;
                break;
              case 'codigo_rm':
                linha.codigoRm = valor;
                break;
              case 'cep':
                linha.cep = valor;
                break;
              case 'logradouro':
                linha.logradouro = valor;
                break;
              case 'numero':
                linha.numero = valor;
                break;
              case 'complemento':
                linha.complemento = valor;
                break;
              case 'bairro':
                linha.bairro = valor;
                break;
              case 'cidade':
                linha.cidade = valor;
                break;
              case 'estado':
                linha.estado = valor;
                break;
              case 'ddd':
                linha.ddd = valor;
                break;
              case 'telefone':
                linha.telefone = valor;
                break;
              case 'email':
                linha.email = valor;
                break;
              case 'faturamento_minimo':
                linha.faturamentoMinimo = parseFloat(valor.replace(',', '.')) || undefined;
                break;
              case 'data_filiacao':
                linha.dataFiliacao = valor;
                break;
              case 'status':
                linha.status = (valor.toUpperCase() as 'A' | 'I' | 'S') || 'A';
                break;
            }
          });
          
          resultados.push(linha);
        }
        
        resolve(resultados);
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(arquivo, 'UTF-8');
    });
  },
  
  /**
   * Validar uma linha de importação
   */
  async validarLinha(linha: AssociadoImportacaoLinha, opcoes: {
    vendedores?: Map<string, number>;
    vendedoresExternos?: Map<string, number>;
    planos?: Map<string, number>;
    categorias?: Map<string, number>;
  }): Promise<AssociadoImportacaoLinha> {
    const erros: string[] = [];
    
    // Validação dos campos obrigatórios
    if (!linha.cnpjCpf) {
      erros.push('CNPJ/CPF é obrigatório');
    } else if (!validarCnpjCpf(linha.cnpjCpf, linha.tipoPessoa)) {
      erros.push(`${linha.tipoPessoa === 'F' ? 'CPF' : 'CNPJ'} inválido`);
    }
    
    if (!linha.nomeRazao) {
      erros.push('Nome/Razão Social é obrigatório');
    }
    
    // Validação de email
    if (linha.email && !validarEmail(linha.email)) {
      erros.push('E-mail inválido');
    }
    
    // Validação de telefone
    if (linha.ddd && linha.telefone && !validarTelefone(linha.ddd, linha.telefone)) {
      erros.push('Telefone inválido');
    }
    
    // Validação de vendedor
    if (linha.codigoVendedor && opcoes.vendedores) {
      const vendedorId = opcoes.vendedores.get(linha.codigoVendedor);
      if (!vendedorId) {
        erros.push(`Vendedor "${linha.codigoVendedor}" não encontrado`);
      }
    }
    
    // Validação de plano
    if (linha.codigoPlano && opcoes.planos) {
      const planoId = opcoes.planos.get(linha.codigoPlano);
      if (!planoId) {
        erros.push(`Plano "${linha.codigoPlano}" não encontrado`);
      }
    }
    
    // Validação de categoria
    if (linha.codigoCategoria && opcoes.categorias) {
      const categoriaId = opcoes.categorias.get(linha.codigoCategoria);
      if (!categoriaId) {
        erros.push(`Categoria "${linha.codigoCategoria}" não encontrada`);
      }
    }
    
    return { ...linha, erros };
  },
  
  /**
   * Converter linha para DTO de associado
   */
  async converterParaDTO(
    linha: AssociadoImportacaoLinha,
    opcoes: {
      vendedores?: Map<string, number>;
      vendedoresExternos?: Map<string, number>;
      planos?: Map<string, number>;
      categorias?: Map<string, number>;
    }
  ): Promise<any> {
    const dto: any = {
      tipoPessoa: linha.tipoPessoa,
      cnpjCpf: normalizarCnpjCpf(linha.cnpjCpf),
      nomeRazao: linha.nomeRazao,
      nomeFantasia: linha.nomeFantasia || undefined,
      status: linha.status || 'A',
      codigoSpc: linha.codigoSpc || undefined,
      codigoRm: linha.codigoRm || undefined,
      faturamentoMinimo: linha.faturamentoMinimo,
      dataFiliacao: linha.dataFiliacao,
      enderecos: [],
      telefones: [],
      emails: []
    };
    
    // Adicionar vendedor
    if (linha.codigoVendedor && opcoes.vendedores) {
      dto.vendedorId = opcoes.vendedores.get(linha.codigoVendedor);
    }
    
    // Adicionar vendedor externo
    if (linha.codigoVendedorExterno && opcoes.vendedoresExternos) {
      dto.vendedorExternoId = opcoes.vendedoresExternos.get(linha.codigoVendedorExterno);
    }
    
    // Adicionar plano
    if (linha.codigoPlano && opcoes.planos) {
      dto.planoId = opcoes.planos.get(linha.codigoPlano);
    }
    
    // Adicionar categoria
    if (linha.codigoCategoria && opcoes.categorias) {
      dto.categoriaId = opcoes.categorias.get(linha.codigoCategoria);
    }
    
    // Adicionar endereço
    if (linha.cep || linha.logradouro) {
      dto.enderecos.push({
        cep: linha.cep || '',
        logradouro: linha.logradouro || '',
        numero: linha.numero || '',
        complemento: linha.complemento || '',
        bairro: linha.bairro || '',
        cidade: linha.cidade || '',
        estado: linha.estado || '',
        tipoEndereco: linha.tipoEndereco || 'COMERCIAL'
      });
    }
    
    // Adicionar telefone
    if (linha.ddd && linha.telefone) {
      dto.telefones.push({
        ddd: linha.ddd,
        numero: linha.telefone,
        tipoTelefone: linha.tipoTelefone || 'COMERCIAL',
        whatsapp: linha.whatsapp || false,
        ativo: true
      });
    }
    
    // Adicionar email
    if (linha.email) {
      dto.emails.push({
        email: linha.email,
        tipoEmail: linha.tipoEmail || 'COMERCIAL',
        ativo: true
      });
    }
    
    return dto;
  },
  
  /**
   * Importar associados em lote
   */
  async importarAssociados(
    arquivo: File,
    onProgress?: (progresso: number, mensagem: string) => void
  ): Promise<ResultadoImportacao> {
    onProgress?.(0, 'Lendo arquivo...');
    
    // 1. Parse do arquivo
    const linhas = await this.parseArquivo(arquivo);
    onProgress?.(10, `Arquivo lido: ${linhas.length} linhas`);
    
    // 2. Carregar opções de mapeamento
    onProgress?.(15, 'Carregando opções de mapeamento...');
    
    // Carregar vendedores
    const vendedores = await vendedorService.listar();
    const mapaVendedores = new Map<string, number>();
    vendedores.forEach(v => {
      mapaVendedores.set(v.codigo || v.nomeRazao, v.id);
    });
    
    const mapaVendedoresExternos = new Map<string, number>();
    // Vendedores do tipo 2 (externos)
    const vendedoresExternos = vendedores.filter(v => v.tipoVendedor === 2);
    vendedoresExternos.forEach(v => {
      mapaVendedoresExternos.set(v.codigo || v.nomeRazao, v.id);
    });
    
    // Carregar planos
    const planos = await associadoService.listarPlanos();
    const mapaPlanos = new Map<string, number>();
    planos.forEach(p => {
      mapaPlanos.set(p.codigo || p.plano, p.id);
    });
    
    // Carregar categorias
    const categorias = await associadoService.listarCategorias();
    const mapaCategorias = new Map<string, number>();
    categorias.forEach(c => {
      mapaCategorias.set(c.codigo || c.descricao, c.id);
    });
    
    // 3. Validar todas as linhas
    onProgress?.(20, 'Validando dados...');
    const linhasComErro: Array<{ linha: number; mensagem: string; dados: AssociadoImportacaoLinha }> = [];
    const linhasValidas: AssociadoImportacaoLinha[] = [];
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const linhaValidada = await this.validarLinha(linha, {
        vendedores: mapaVendedores,
        vendedoresExternos: mapaVendedoresExternos,
        planos: mapaPlanos,
        categorias: mapaCategorias
      });
      
      if (linhaValidada.erros && linhaValidada.erros.length > 0) {
        linhaValidada.erros.forEach(erro => {
          linhasComErro.push({
            linha: i + 2,
            mensagem: erro,
            dados: linha
          });
        });
      } else {
        linhasValidas.push(linhaValidada);
      }
      
      const percentual = 20 + (i / linhas.length) * 30;
      onProgress?.(percentual, `Validando linha ${i + 1}/${linhas.length}`);
    }
    
    // 4. Importar associados válidos
    onProgress?.(50, `Importando ${linhasValidas.length} associados...`);
    const associadosImportados: any[] = [];
    
    for (let i = 0; i < linhasValidas.length; i++) {
      const linha = linhasValidas[i];
      try {
        const dto = await this.converterParaDTO(linha, {
          vendedores: mapaVendedores,
          vendedoresExternos: mapaVendedoresExternos,
          planos: mapaPlanos,
          categorias: mapaCategorias
        });
        
        const novoAssociado = await associadoService.criar(dto);
        associadosImportados.push(novoAssociado);
        
        const percentual = 50 + (i / linhasValidas.length) * 45;
        onProgress?.(percentual, `Importando ${i + 1}/${linhasValidas.length}: ${linha.nomeRazao}`);
        
      } catch (error: any) {
        linhasComErro.push({
          linha: (linha.linha || 0) + 1,
          mensagem: error.response?.data?.message || error.message || 'Erro ao salvar',
          dados: linha
        });
      }
    }
    
    // 5. Finalizar
    onProgress?.(95, 'Finalizando importação...');
    
    const resultado: ResultadoImportacao = {
      totalLinhas: linhas.length,
      linhasProcessadas: linhasValidas.length,
      linhasComErro: linhasComErro.length,
      associadosImportados: associadosImportados.length,
      erros: linhasComErro,
      detalhes: linhasValidas
    };
    
    onProgress?.(100, 'Importação concluída!');
    
    return resultado;
  },
  
  /**
   * Download do modelo de arquivo para importação
   */
  downloadModelo(): void {
    const cabecalho = [
      'tipo_pessoa',
      'cnpj_cpf',
      'nome_razao',
      'nome_fantasia',
      'codigo_vendedor',
      'codigo_vendedor_externo',
      'codigo_plano',
      'codigo_categoria',
      'codigo_spc',
      'codigo_rm',
      'cep',
      'logradouro',
      'numero',
      'complemento',
      'bairro',
      'cidade',
      'estado',
      'ddd',
      'telefone',
      'email',
      'faturamento_minimo',
      'data_filiacao',
      'status'
    ];
    
    const exemplo = [
      'F',
      '12345678901',
      'JOÃO DA SILVA',
      'JOAO',
      'VEND001',
      '',
      'PLANO001',
      'CAT001',
      'SPC001',
      'RM001',
      '01001000',
      'RUA EXEMPLO',
      '100',
      'APTO 101',
      'CENTRO',
      'SÃO PAULO',
      'SP',
      '11',
      '999999999',
      'joao@email.com',
      '1000.00',
      '01/01/2025',
      'A'
    ];
    
    const conteudo = [
      cabecalho.join(';'),
      exemplo.join(';')
    ].join('\n');
    
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_importacao_associados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};