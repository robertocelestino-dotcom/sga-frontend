export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    nome: string;
    ativo: boolean;
  }
  
  export interface LoginRequest {
    username: string;
    password: string;
  }
  
  export interface AuthResponse {
    token: string;
    type: string;
  }