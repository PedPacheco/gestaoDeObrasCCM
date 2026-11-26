import { Request } from 'express';
import { LoginUserResponseDTO } from '../../dtos/loginUserDto';
import { RegisterUserResponseDTO } from '../../dtos/registerUserDto';
import { ApiResponse } from '../shared/apiResponse.types';

// ---------- request autenticado ----------
export interface JwtPayload {
  sub: number;
  username: string;
  // acrescente o que o JwtStrategy/guard coloca no payload
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// ---------- respostas ----------
export type LoginResponse = ApiResponse<LoginUserResponseDTO>;
export type UserRegisterResponse = ApiResponse<RegisterUserResponseDTO>;
