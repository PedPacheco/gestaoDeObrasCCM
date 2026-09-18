import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { AuthService } from 'src/application/usecases/auth.service';

import { loginInterfaceController } from 'src/interface/types/userInterface';

import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';

import { Public } from '../../shared/costants';
import { LoginUserDTO, LoginUserResponseDTO } from '../dtos/loginUserDto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() { user, password }: LoginUserDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<loginInterfaceController> {
    const data = await this.authService.login(user, password);

    res.cookie('token', data.access_token, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Login realizado com sucesso',
      data: plainToInstance(LoginUserResponseDTO, data),
    };
  }
}
