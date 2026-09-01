
export interface Perfil {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  menus?: Menu[];
  permissoes?: Permissao[];
}

export interface Menu {
  id: number;
  nome: string;
  caminho: string | null;
  icone: string;
  ordem: number;
  ativo: boolean;
  menuPaiId: number | null;
  menuPaiNome?: string;
  subMenus: Menu[];
}

export interface Permissao {
  id: number;
  nome: string;
  descricao: string;
  recurso: string;
  acao: string;
}

export interface Usuario {
  id: number;
  username: string;
  email: string;
  nomeCompleto: string;
  ativo: boolean;
  bloqueado: boolean;
  ultimoLogin: string | null;
  perfilId: number;
  perfilNome: string;
  role: string;
}

export interface UsuarioRequest {
  username: string;
  email: string;
  senha: string;
  nomeCompleto: string;
  perfilId: number;
  ativo?: boolean;
}

export interface UsuarioUpdateRequest {
  nomeCompleto: string;
  email: string;
  perfilId?: number;
  ativo?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  usuario: Usuario;
  menus: Menu[];
  permissoes: string[];
}

export interface LoginResult {
  success: boolean;
  error?: string;
}
