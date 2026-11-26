import { UserSafeResponseDTO } from '../../dtos/userSafeResponseDto';
import { ApiResponse } from '../shared/apiResponse.types';

export type UserListResponse = ApiResponse<UserSafeResponseDTO[]>;
export type UserAdminCreateResponse = ApiResponse<UserSafeResponseDTO>;
export type UserDeactivateResponse = ApiResponse<UserSafeResponseDTO>;
