import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const DISABLE_WHITELIST_KEY = 'disable_whitelist';
export const DisableWhitelist = () => SetMetadata(DISABLE_WHITELIST_KEY, true);
