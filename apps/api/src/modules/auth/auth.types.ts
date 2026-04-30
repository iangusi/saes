export interface LoginResult {
  token: string;
  user: {
    id: number;
    identificador: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    correo: string;
    roles: string[];
  };
}
