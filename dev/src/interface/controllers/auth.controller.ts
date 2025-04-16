import { plainToInstance } from 'class-transformer';
import { Response } from 'express';
import { AuthService } from 'src/domain/services/auth.service';
import {
  RegisterUserDTO,
  RegisterUserResponseDTO,
} from 'src/interface/dtos/registerUserDto';
import {
  loginInterfaceController,
  userRegisterInterfaceController,
} from 'src/interface/types/userInterface';

import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';

import { Public } from '../../shared/costants';
import { LoginUserDTO, LoginUserResponseDTO } from '../dtos/loginUserDto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
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

  @Post('register')
  async register(
    @Body() registerDto: RegisterUserDTO,
  ): Promise<userRegisterInterfaceController> {
    const user = await this.authService.register(registerDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuário cadastrado com sucesso',
      data: plainToInstance(RegisterUserResponseDTO, user),
    };
  }
}
