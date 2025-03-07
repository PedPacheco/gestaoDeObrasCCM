import { Response } from 'express';
import { AuthService } from 'src/domain/services/auth.service';
import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';
import { ResetPasswordDTO } from 'src/interface/dtos/resetPasswordDto';
import {
  loginInterfaceController,
  userRegisterInterfaceController,
} from 'src/interface/types/userInterface';

import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';

import { Public } from '../../shared/costants';
import { LoginUserDTO } from '../dtos/loginUserDto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() { user, password }: LoginUserDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<loginInterfaceController> {
    console.log(user, password);
    const { id, username, id_regional, nome_usuario, email, access_token } =
      await this.authService.login(user, password);

    res.cookie('token', access_token, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Login realizado com sucesso',
      data: {
        id,
        username,
        id_regional,
        nome_usuario,
        email,
      },
    };
  }

  @Post('register')
  async register(
    @Body() registerDto: RegisterUserDTO,
  ): Promise<userRegisterInterfaceController> {
    const { id, username } = await this.authService.register(registerDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuário cadastrado com sucesso',
      data: {
        id,
        username,
      },
    };
  }

  @Public()
  @Post('send-email-reset-password')
  async resetPassword(
    @Body() { username }: ResetPasswordDTO,
  ): Promise<{ statusCode: number; message: string }> {
    await this.authService.sendEmailResetPassword(username);

    return {
      statusCode: HttpStatus.OK,
      message: 'Link de redefinição de senha enviado com sucesso',
    };
  }
}
