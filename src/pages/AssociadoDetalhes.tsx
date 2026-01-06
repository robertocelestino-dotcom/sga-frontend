// src/pages/AssociadoDetalhes.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Divider,
  Button, Stack, Alert, CircularProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip
} from '@mui/material';
import { ArrowBack, Edit, Phone, Email, LocationOn } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { associadoService, associadoOpcoes } from '../services/associadoService';
import { AssociadoDTO } from '../types/associado';

const AssociadoDetalhes: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [associado, setAssociado] = useState<AssociadoDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    carregarAssociado();
  }, [id]);
  
  const carregarAssociado = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await associadoService.buscarPorId(parseInt(id));
      setAssociado(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar associado');
      console.error('Erro ao carregar associado:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleVoltar = () => {
    navigate('/associados');
  };
  
  const handleEditar = () => {
    navigate(`/associados/editar/${id}`);
  };
  
  // Funções de formatação
  const formatarCnpjCpf = (cnpjCpf: string) => {
    if (!cnpjCpf) return '-';
    
    const apenasNumeros = cnpjCpf.replace(/\D/g, '');
    
    if (apenasNumeros.length === 11) {
      return cnpjCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (apenasNumeros.length === 14) {
      return cnpjCpf.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return cnpjCpf;
  };
  
  const formatarData = (dataString?: string) => {
    if (!dataString) return '-';
    return new Date(dataString).toLocaleDateString('pt-BR');
  };
  
  const formatarValor = (valor?: number) => {
    if (!valor) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };
  
  const getStatusInfo = (status: string) => {
    const opcao = associadoOpcoes.status.find(s => s.value === status);
    if (!opcao) return { label: 'Desconhecido', color: 'default' as const };
    
    const color = status === 'A' ? 'success' : 
                  status === 'I' ? 'error' : 'warning';
    
    return { label: opcao.label, color };
  };
  
  const getTipoPessoaInfo = (tipo: string) => {
    const opcao = associadoOpcoes.tipoPessoa.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };
  
  const getTipoEnderecoInfo = (tipo: string) => {
    const opcao = associadoOpcoes.tipoEndereco.find(t => t.value === tipo);
    return opcao ? opcao.label : tipo;
  };
  
  const getTipoContatoIcon = (tipo: string) => {
    switch (tipo) {
      case 'COMERCIAL': return <Phone fontSize="small" />;
      case 'CELULAR': return <Phone fontSize="small" />;
      case 'PESSOAL': return <Email fontSize="small" />;
      default: return null;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !associado) {
    return (
      <Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleVoltar}
          sx={{ mb: 3 }}
        >
          Voltar
        </Button>
        
        <Alert severity="error">
          {error || 'Associado não encontrado'}
        </Alert>
      </Box>
    );
  }
  
  const statusInfo = getStatusInfo(associado.status);
  
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={handleVoltar}
              >
                Voltar
              </Button>
              <Typography variant="h5">
                Detalhes do Associado
              </Typography>
            </Stack>
            
            <Button
              variant="contained"
              startIcon={<Edit />}
              onClick={handleEditar}
            >
              Editar
            </Button>
          </Stack>
          
          <Grid container spacing={3}>
            {/* Informações Básicas */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Informações Básicas
                    <Chip 
                      label={statusInfo.label}
                      color={statusInfo.color}
                      size="small"
                    />
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Nome/Razão Social
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {associado.nomeRazao}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Nome Fantasia
                      </Typography>
                      <Typography variant="body1">
                        {associado.nomeFantasia || '-'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        CNPJ/CPF
                      </Typography>
                      <Typography variant="body1">
                        {formatarCnpjCpf(associado.cnpjCpf)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Tipo Pessoa
                      </Typography>
                      <Typography variant="body1">
                        {getTipoPessoaInfo(associado.tipoPessoa)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Data de Cadastro
                      </Typography>
                      <Typography variant="body1">
                        {formatarData(associado.dataCadastro)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Código SPC
                      </Typography>
                      <Typography variant="body1">
                        {associado.codigoSpc || '-'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Código RM
                      </Typography>
                      <Typography variant="body1">
                        {associado.codigoRm || '-'}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="body2" color="textSecondary">
                        Faturamento Mínimo
                      </Typography>
                      <Typography variant="body1">
                        {formatarValor(associado.faturamentoMinimo)}
                      </Typography>
                    </Grid>
                    
                    {/* Relacionamentos */}
                    {associado.vendedorNome && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          Vendedor
                        </Typography>
                        <Typography variant="body1">
                          {associado.vendedorNome}
                        </Typography>
                      </Grid>
                    )}
                    
                    {associado.planoNome && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          Plano
                        </Typography>
                        <Typography variant="body1">
                          {associado.planoNome}
                        </Typography>
                      </Grid>
                    )}
                    
                    {associado.categoriaNome && (
                      <Grid item xs={12} md={4}>
                        <Typography variant="body2" color="textSecondary">
                          Categoria
                        </Typography>
                        <Typography variant="body1">
                          {associado.categoriaNome}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Endereços */}
            {associado.enderecos && associado.enderecos.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn /> Endereços
                    </Typography>
                    
                    {associado.enderecos.map((endereco, index) => (
                      <Box key={endereco.id || index} sx={{ mb: 3, pb: 2, borderBottom: index < associado.enderecos!.length - 1 ? '1px solid #eee' : 'none' }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Chip 
                            label={getTipoEnderecoInfo(endereco.tipoEndereco)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Stack>
                        
                        <Typography variant="body2">
                          {endereco.tipoLogradouro} {endereco.logradouro}, {endereco.numero}
                          {endereco.complemento && `, ${endereco.complemento}`}
                        </Typography>
                        
                        <Typography variant="body2">
                          {endereco.bairro} - {endereco.cidade}/{endereco.estado}
                        </Typography>
                        
                        <Typography variant="body2" color="textSecondary">
                          CEP: {endereco.cep}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Contatos (Telefones e Emails) */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  {/* Telefones */}
                  {associado.telefones && associado.telefones.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone /> Telefones
                      </Typography>
                      
                      {associado.telefones.map((telefone, index) => (
                        <Box key={telefone.id || index} sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            {getTipoContatoIcon(telefone.tipoTelefone)}
                            <Typography variant="body2" fontWeight="medium">
                              ({telefone.ddd}) {telefone.numero}
                            </Typography>
                            {telefone.whatsapp && (
                              <Chip label="WhatsApp" size="small" color="success" />
                            )}
                            {!telefone.ativo && (
                              <Chip label="Inativo" size="small" color="error" variant="outlined" />
                            )}
                          </Stack>
                          
                          <Stack direction="row" spacing={1}>
                            <Chip 
                              label={telefone.tipoTelefone}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                      ))}
                      
                      <Divider sx={{ my: 2 }} />
                    </>
                  )}
                  
                  {/* Emails */}
                  {associado.emails && associado.emails.length > 0 && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Email /> Emails
                      </Typography>
                      
                      {associado.emails.map((email, index) => (
                        <Box key={email.id || index} sx={{ mb: 2 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {email.email}
                            </Typography>
                            {!email.ativo && (
                              <Chip label="Inativo" size="small" color="error" variant="outlined" />
                            )}
                          </Stack>
                          
                          <Stack direction="row" spacing={1}>
                            <Chip 
                              label={email.tipoEmail}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        </Box>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Definições de Notificação */}
            {associado.definicoesNotificacao && associado.definicoesNotificacao.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Definições de Notificação
                    </Typography>
                    
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Produto</TableCell>
                            <TableCell align="right">Valor</TableCell>
                            <TableCell>Data Início</TableCell>
                            <TableCell>Data Fim</TableCell>
                            <TableCell>Envio Padrão</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {associado.definicoesNotificacao.map((def, index) => (
                            <TableRow key={def.id || index}>
                              <TableCell>{def.produtoNome || `Produto ${def.produtoId}`}</TableCell>
                              <TableCell align="right">
                                {def.valorDefinido ? formatarValor(def.valorDefinido) : '-'}
                              </TableCell>
                              <TableCell>{formatarData(def.dataInicio)}</TableCell>
                              <TableCell>{formatarData(def.dataFim)}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={def.envioPadrao === 'S' ? 'Sim' : 'Não'}
                                  size="small"
                                  color={def.envioPadrao === 'S' ? 'success' : 'default'}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={def.statusNoProcesso === 'A' ? 'Ativo' : 'Inativo'}
                                  size="small"
                                  color={def.statusNoProcesso === 'A' ? 'success' : 'error'}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {/* Definições de Faturamento */}
            {associado.definicoesFaturamento && associado.definicoesFaturamento.length > 0 && (
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Definições de Faturamento
                    </Typography>
                    
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Plano</TableCell>
                            <TableCell align="right">Valor</TableCell>
                            <TableCell align="center">Dia Emissão</TableCell>
                            <TableCell align="center">Dia Vencimento</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {associado.definicoesFaturamento.map((def, index) => (
                            <TableRow key={def.id || index}>
                              <TableCell>{def.planoNome || `Plano ${def.planoId}`}</TableCell>
                              <TableCell align="right">
                                {def.valorDef ? formatarValor(def.valorDef) : '-'}
                              </TableCell>
                              <TableCell align="center">{def.diaEmissao || '-'}</TableCell>
                              <TableCell align="center">{def.diaVencimento || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AssociadoDetalhes;