import { SetMetadata } from '@nestjs/common';

export const jwtConstants = {
  secret: '3d0eb89ef7a33e771879d659f5c640977ed05ae9db0dfe3d8c2c3bb54b16d2a7',
};

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
