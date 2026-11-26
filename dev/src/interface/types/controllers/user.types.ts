import { UserSafeResponseDTO } from 'src/interface/dtos/userDTO';
import { ApiResponse } from '../shared/apiResponse.types';

export type UserListResponse = ApiResponse<UserSafeResponseDTO[]>;
export type UserAdminCreateResponse = ApiResponse<UserSafeResponseDTO>;
export type UserDeactivateResponse = ApiResponse<UserSafeResponseDTO>;
