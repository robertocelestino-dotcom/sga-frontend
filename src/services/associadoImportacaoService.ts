// src/services/associadoImportacaoService.ts

import api from './api';
import { AssociadoImportacaoLinha, ResultadoImportacao } from '../types/associadoImportacao';
import { associadoService } from './associadoService';

// 🔥 CONSTANTES DE CONFIGURAÇÃO PADRÃO DE FATURAMENTO
const CONFIG_FATURAMENTO_PADRAO = {
  planoId: 5,
  diaEmissao: 26,
  diaVencimento: 10,
  valorDef: 85.00,
  observacao: 'Importado em lote - Configuração padrão'
};

// 🔥 FUNÇÃO PARA CONVERTER DATA DO FORMATO DD/MM/YYYY PARA YYYY-MM-DD
const converterDataParaISO = (dataStr: string): string => {
  if (!dataStr) return '';
  
  const regexDDMMYYYY = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dataStr.match(regexDDMMYYYY);
  
  if (match) {
    const dia = match[1];
    const mes = match[2];
    const ano = match[3];
    return `${ano}-${mes}-${dia}`;
  }
  
  const regexYYYYMMDD = /^(\d{4})-(\d{2})-(\d{2})$/;
  if (regexYYYYMMDD.test(dataStr)) {
    return dataStr;
  }
  
  try {
    const data = new Date(dataStr);
    if (!isNaN(data.getTime())) {
      return data.toISOString().split('T')[0];
    }
  } catch (e) {
    console.warn('Erro ao converter data:', dataStr);
  }
  
  return dataStr;
};

// 🔥 FUNÇÃO PARA NORMALIZAR TELEFONE (separar DDD do número)
const normalizarTelefone = (ddd: string, telefone: string): { ddd: string; numero: string } => {
  if (!ddd && !telefone) return { ddd: '', numero: '' };
  
  if (!ddd && telefone && telefone.length >= 10) {
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length >= 10) {
      const novoDdd = telefoneLimpo.substring(0, 2);
      const novoNumero = telefoneLimpo.substring(2);
      return { ddd: novoDdd, numero: novoNumero };
    }
  }
  
  return { ddd: ddd || '', numero: telefone || '' };
};

// 🔥 FUNÇÃO PARA LIMPAR E NORMALIZAR EMAIL (com fallback padrão)
const normalizarEmail = (email: string, usarPadrao: boolean = true): string => {
  if (!email || email.trim() === '') {
    return usarPadrao ? 'sistema_sga@cdlfor.com.br' : '';
  }
  
  let emailLimpo = email.trim().toLowerCase();
  
  // Remover caracteres inválidos
  emailLimpo = emailLimpo.replace(/\s/g, '');
  emailLimpo = emailLimpo.replace(/[\(\)\[\]\{\}]/g, '');
  
  // Se não tiver @, retorna padrão
  if (!emailLimpo.includes('@')) {
    return usarPadrao ? 'sistema_sga@cdlfor.com.br' : '';
  }
  
  const [usuario, dominio] = emailLimpo.split('@');
  
  if (!usuario || !dominio) {
    return usarPadrao ? 'sistema_sga@cdlfor.com.br' : '';
  }
  
  // Se o domínio não tiver ponto, adicionar .com.br
  if (!dominio.includes('.')) {
    emailLimpo = `${usuario}@${dominio}.com.br`;
  }
  
  if (emailLimpo.endsWith('.')) {
    emailLimpo = emailLimpo.slice(0, -1);
  }
  
  return emailLimpo;
};

// 🔥 FUNÇÃO PARA CRIAR CONFIGURAÇÕES DE FATURAMENTO (SEMPRE INCLUÍDA)
const criarConfiguracoesFaturamento = (planoId?: number, valorDef?: number) => {
  // Configuração padrão: dia_emissao = 26, dia_vencimento = 10, planoId = 5, valor_def = 85.00
  const config = {
    planoId: planoId || CONFIG_FATURAMENTO_PADRAO.planoId,
    diaEmissao: CONFIG_FATURAMENTO_PADRAO.diaEmissao,
    diaVencimento: CONFIG_FATURAMENTO_PADRAO.diaVencimento,
    observacao: CONFIG_FATURAMENTO_PADRAO.observacao,
    valorDef: valorDef || CONFIG_FATURAMENTO_PADRAO.valorDef
  };
  
  return [config];
};

// 🔥 FUNÇÃO PARA REPLICAR ENDEREÇO COMERCIAL PARA OS DEMAIS TIPOS
const replicarEnderecoComercial = (enderecoComercial: any) => {
  if (!enderecoComercial) return [];
  
  const tiposEndereco = ['RESIDENCIAL', 'COBRANCA', 'ENTREGA'];
  
  return tiposEndereco.map(tipo => ({
    ...enderecoComercial,
    tipoEndereco: tipo
  }));
};

// 🔥 FUNÇÃO PARA REPLICAR TELEFONE COMERCIAL PARA OS DEMAIS TIPOS
const replicarTelefoneComercial = (telefoneComercial: any) => {
  if (!telefoneComercial || !telefoneComercial.ddd || !telefoneComercial.numero) return [];
  
  const tiposTelefone = ['RESIDENCIAL', 'CELULAR', 'FAX'];
  
  return tiposTelefone.map(tipo => ({
    ddd: telefoneComercial.ddd,
    numero: telefoneComercial.numero,
    tipoTelefone: tipo,
    whatsapp: tipo === 'CELULAR',
    ativo: true
  }));
};

// 🔥 FUNÇÃO PARA REPLICAR EMAIL COMERCIAL PARA OS DEMAIS TIPOS
const replicarEmailComercial = (emailComercial: string) => {
  if (!emailComercial) return [];
  
  const tiposEmail = ['PESSOAL', 'COBRANCA'];
  
  return tiposEmail.map(tipo => ({
    email: emailComercial,
    tipoEmail: tipo,
    ativo: true
  }));
};

// 🔥 FUNÇÃO PARA CARREGAR MAPEAMENTO
const carregarMapeamento = async () => {
  const mapaVendedores = new Map<string, number>();
  const mapaVendedoresExternos = new Map<string, number>();
  const mapaPlanos = new Map<string, number>();
  const mapaCategorias = new Map<string, number>();
  
  try {
    const vendedores = await associadoService.listarVendedores();
    vendedores.forEach(v => {
      mapaVendedores.set(v.nomeRazao, v.id);
      if (v.id) mapaVendedores.set(v.id.toString(), v.id);
    });
    
    const planos = await associadoService.listarPlanos();
    planos.forEach(p => {
      mapaPlanos.set(p.nome, p.id);
      if (p.id) mapaPlanos.set(p.id.toString(), p.id);
    });
    
    const categorias = await associadoService.listarCategorias();
    categorias.forEach(c => {
      mapaCategorias.set(c.descricao, c.id);
      if (c.id) mapaCategorias.set(c.id.toString(), c.id);
    });
    
    console.log('✅ Mapeamento carregado:', {
      vendedores: mapaVendedores.size,
      planos: mapaPlanos.size,
      categorias: mapaCategorias.size
    });
    
  } catch (error) {
    console.error('❌ Erro ao carregar mapeamento:', error);
  }
  
  return { mapaVendedores, mapaVendedoresExternos, mapaPlanos, mapaCategorias };
};

const validarCnpjCpf = (valor: string, tipo: 'F' | 'J'): boolean => {
  if (!valor) return false;
  const apenasNumeros = valor.replace(/\D/g, '');
  
  if (tipo === 'F') {
    if (apenasNumeros.length !== 11) return false;
    if (/^(\d)\1+$/.test(apenasNumeros)) return false;
    return true;
  } else {
    if (apenasNumeros.length !== 14) return false;
    if (/^(\d)\1+$/.test(apenasNumeros)) return false;
    return true;
  }
};

const normalizarCnpjCpf = (valor: string): string => {
  return valor.replace(/\D/g, '');
};

const normalizarStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ATIVO': 'A',
    'INATIVO': 'I',
    'SUSPENSO': 'S',
    'A': 'A',
    'I': 'I',
    'S': 'S'
  };
  return statusMap[status?.toUpperCase()] || 'A';
};

export const associadoImportacaoService = {
  async parseArquivo(arquivo: File): Promise<AssociadoImportacaoLinha[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const conteudo = e.target?.result as string;
        const linhas = conteudo.split(/\r?\n/);
        
        if (linhas.length < 2) {
          reject(new Error('Arquivo vazio ou sem dados'));
          return;
        }
        
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
          
          cabecalho.forEach((campo, idx) => {
            const valor = valores[idx]?.trim() || '';
            const campoLower = campo.toLowerCase();
            
            switch (campoLower) {
              case 'tipo_pessoa':
                linha.tipoPessoa = valor.toUpperCase() === 'J' ? 'J' : 'F';
                break;
              case 'cnpj_cpf':
                linha.cnpjCpf = valor;
                break;
              case 'nome_razao':
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
                linha.status = normalizarStatus(valor) as 'A' | 'I' | 'S';
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
  
  async importarAssociados(
    arquivo: File,
    onProgress?: (progresso: number, mensagem: string) => void
  ): Promise<ResultadoImportacao> {
    console.log('🚀 Iniciando importação de associados');
    onProgress?.(0, 'Lendo arquivo...');
    
    const linhas = await this.parseArquivo(arquivo);
    onProgress?.(10, `Arquivo lido: ${linhas.length} linhas`);
    
    onProgress?.(15, 'Carregando opções de mapeamento...');
    const { mapaVendedores, mapaPlanos, mapaCategorias } = await carregarMapeamento();
    
    onProgress?.(20, 'Validando dados...');
    const linhasComErro: Array<{ linha: number; mensagem: string; dados: AssociadoImportacaoLinha }> = [];
    const associadosParaAPI: any[] = [];
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const erros: string[] = [];
      
      if (!linha.cnpjCpf) {
        erros.push('CNPJ/CPF é obrigatório');
      } else if (!validarCnpjCpf(linha.cnpjCpf, linha.tipoPessoa)) {
        erros.push(`${linha.tipoPessoa === 'F' ? 'CPF' : 'CNPJ'} inválido`);
      }
      
      if (!linha.nomeRazao) {
        erros.push('Nome/Razão Social é obrigatório');
      }
      
      // Email é sempre válido (terá fallback)
      const emailOriginal = linha.email;
      const emailNormalizado = normalizarEmail(emailOriginal, true);
      
      if (emailOriginal && emailOriginal !== emailNormalizado) {
        console.log(`📧 Email normalizado: "${emailOriginal}" -> "${emailNormalizado}"`);
      }
      
      const vendedorId = linha.codigoVendedor ? mapaVendedores.get(linha.codigoVendedor) : undefined;
      // 🔥 Plano padrão = 5 (garantido)
      const planoId = linha.codigoPlano ? mapaPlanos.get(linha.codigoPlano) : CONFIG_FATURAMENTO_PADRAO.planoId;
      const categoriaId = linha.codigoCategoria ? mapaCategorias.get(linha.codigoCategoria) : undefined;
      
      if (erros.length > 0) {
        erros.forEach(erro => {
          linhasComErro.push({ linha: i + 2, mensagem: erro, dados: linha });
        });
        continue;
      }
      
      // Preparar DTO
      const dataFiliacaoISO = linha.dataFiliacao ? converterDataParaISO(linha.dataFiliacao) : '';
      const telefoneNormalizado = normalizarTelefone(linha.ddd || '', linha.telefone || '');
      
      // 🔥 CRIAR ENDEREÇO COMERCIAL (se disponível)
      let enderecoComercial = null;
      if (linha.cep || linha.logradouro) {
        enderecoComercial = {
          cep: linha.cep || '',
          logradouro: linha.logradouro || '',
          numero: linha.numero || '',
          complemento: linha.complemento || '',
          bairro: linha.bairro || '',
          cidade: linha.cidade || '',
          estado: linha.estado || '',
          tipoEndereco: 'COMERCIAL'
        };
      }
      
      // 🔥 CRIAR TELEFONE COMERCIAL (se disponível)
      let telefoneComercial = null;
      if (telefoneNormalizado.ddd && telefoneNormalizado.numero) {
        telefoneComercial = {
          ddd: telefoneNormalizado.ddd,
          numero: telefoneNormalizado.numero,
          tipoTelefone: 'COMERCIAL',
          whatsapp: false,
          ativo: true
        };
      }
      
      // 🔥 CRIAR EMAIL COMERCIAL (sempre terá valor, pois tem fallback)
      const emailComercial = emailNormalizado;
      
      // 🔥 MONTAR LISTA DE ENDEREÇOS (COMERCIAL + REPLICAÇÕES)
      const enderecos = [];
      if (enderecoComercial) {
        enderecos.push(enderecoComercial);
        enderecos.push(...replicarEnderecoComercial(enderecoComercial));
      }
      
      // 🔥 MONTAR LISTA DE TELEFONES (COMERCIAL + REPLICAÇÕES)
      const telefones = [];
      if (telefoneComercial) {
        telefones.push(telefoneComercial);
        telefones.push(...replicarTelefoneComercial(telefoneComercial));
      }
      
      // 🔥 MONTAR LISTA DE EMAILS (COMERCIAL + REPLICAÇÕES)
      const emails = [];
      if (emailComercial) {
        emails.push({
          email: emailComercial,
          tipoEmail: 'COMERCIAL',
          ativo: true
        });
        emails.push(...replicarEmailComercial(emailComercial));
      }
      
      const dto: any = {
        tipoPessoa: linha.tipoPessoa,
        cnpjCpf: normalizarCnpjCpf(linha.cnpjCpf),
        nomeRazao: linha.nomeRazao,
        nomeFantasia: linha.nomeFantasia || undefined,
        status: linha.status || 'A',
        codigoSpc: linha.codigoSpc || undefined,
        codigoRm: linha.codigoRm || undefined,
        faturamentoMinimo: linha.faturamentoMinimo || 0,
        dataFiliacao: dataFiliacaoISO,
        vendedorId: vendedorId,
        planoId: planoId,
        categoriaId: categoriaId,
        // 🔥 CONFIGURAÇÕES DE FATURAMENTO (SEMPRE INCLUÍDAS)
        definicoesFaturamento: criarConfiguracoesFaturamento(planoId, CONFIG_FATURAMENTO_PADRAO.valorDef),
        enderecos: enderecos,
        telefones: telefones,
        emails: emails
      };
      
      associadosParaAPI.push(dto);
      
      const percentual = 20 + (i / linhas.length) * 30;
      onProgress?.(percentual, `Validando linha ${i + 1}/${linhas.length}`);
    }
    
    onProgress?.(50, `Importando ${associadosParaAPI.length} associados...`);
    const associadosImportados: any[] = [];
    let criados = 0;
    let atualizados = 0;
    let configuracoesCriadas = 0;
    
    if (associadosParaAPI.length > 0) {
      try {
        console.log(`📤 Enviando ${associadosParaAPI.length} associados para importação em lote...`);
        
        const response = await api.post('/associados/importacao/lote', associadosParaAPI);
        
        criados = parseInt(response.headers['x-importacao-criados'] || '0');
        atualizados = parseInt(response.headers['x-importacao-atualizados'] || '0');
        configuracoesCriadas = parseInt(response.headers['x-importacao-configuracoes'] || '0');
        
        associadosImportados.push(...response.data);
        
        console.log(`✅ Importação concluída: ${criados} criados, ${atualizados} atualizados, ${configuracoesCriadas} configurações criadas`);
        
      } catch (error: any) {
        console.error('❌ Erro na importação em lote:', error);
        
        console.log('🔄 Tentando importação individual...');
        
        for (let i = 0; i < associadosParaAPI.length; i++) {
          const dto = associadosParaAPI[i];
          try {
            const response = await api.post('/associados/importacao/lote', [dto]);
            associadosImportados.push(response.data[0]);
            
            const criadoCount = parseInt(response.headers['x-importacao-criados'] || '0');
            if (criadoCount > 0) {
              criados++;
              configuracoesCriadas++;
            } else {
              atualizados++;
            }
            
            const percentual = 50 + (i / associadosParaAPI.length) * 45;
            onProgress?.(percentual, `Importando ${i + 1}/${associadosParaAPI.length}: ${dto.nomeRazao}`);
            
          } catch (err: any) {
            console.error(`❌ Erro ao importar ${dto.nomeRazao}:`, err);
            linhasComErro.push({
              linha: 0,
              mensagem: err.response?.data?.message || err.message || 'Erro ao salvar',
              dados: dto
            });
          }
        }
      }
    }
    
    onProgress?.(95, 'Finalizando importação...');
    
    const resultado: ResultadoImportacao = {
      totalLinhas: linhas.length,
      linhasProcessadas: associadosParaAPI.length,
      linhasComErro: linhasComErro.length,
      associadosImportados: associadosImportados.length,
      erros: linhasComErro,
      detalhes: [],
      criados: criados,
      atualizados: atualizados,
      configuracoesCriadas: configuracoesCriadas
    };
    
    console.log('📊 Resultado final:', {
      total: resultado.totalLinhas,
      processadas: resultado.linhasProcessadas,
      erros: resultado.linhasComErro,
      criados: criados,
      atualizados: atualizados,
      configuracoesCriadas: configuracoesCriadas
    });
    
    onProgress?.(100, 'Importação concluída!');
    return resultado;
  },
  
  downloadModelo(): void {
    const cabecalho = [
      'tipo_pessoa', 'cnpj_cpf', 'nome_razao', 'nome_fantasia', 'codigo_vendedor',
      'codigo_vendedor_externo', 'codigo_plano', 'codigo_categoria', 'codigo_spc', 'codigo_rm',
      'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado',
      'ddd', 'telefone', 'email', 'faturamento_minimo', 'data_filiacao', 'status'
    ];
    
    const exemplos = [
      'F;12345678901;JOÃO DA SILVA;JOAO;;;;;SPC001;RM001;01001000;RUA EXEMPLO;100;APTO 101;CENTRO;SÃO PAULO;SP;11;912345678;joao.silva@email.com;1000.00;2025-01-01;A',
      'J;12345678000199;EMPRESA EXEMPLO LTDA;EMPRESA;;;;;SPC002;RM002;02002000;AVENIDA TESTE;200;SALA 202;JARDINS;RIO DE JANEIRO;RJ;21;987654321;contato@empresa.com;5000.00;2025-03-10;A'
    ];
    
    // Adicionar instruções sobre configuração de faturamento
    const instrucoes = [
      '# ============================================================',
      '# INSTRUÇÕES DE IMPORTAÇÃO:',
      '# - A configuração de faturamento será CRIADA AUTOMATICAMENTE para cada associado',
      '# - Valores padrão: Plano ID=5, Dia Emissão=26, Dia Vencimento=10, Valor=R$85,00',
      '# - Para associados já existentes, a configuração será criada apenas se não existir',
      '# ============================================================',
      ''
    ];
    
    const conteudo = [...instrucoes, cabecalho.join(';'), ...exemplos].join('\n');
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

export interface ResultadoImportacao {
  totalLinhas: number;
  linhasProcessadas: number;
  linhasComErro: number;
  associadosImportados: number;
  erros: Array<{ linha: number; mensagem: string; dados: AssociadoImportacaoLinha }>;
  detalhes: AssociadoImportacaoLinha[];
  criados?: number;
  atualizados?: number;
  configuracoesCriadas?: number;
}