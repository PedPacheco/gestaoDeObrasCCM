import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../../config/costants';
import { LoginUserDTO } from '../../config/dto/loginUserDto';
import { RegisterUserDTO } from 'src/config/dto/registerUserDto';
import {
  loginInterfaceController,
  userRegisterInterfaceController,
} from 'src/types/userInterface';
import { ResetPasswordDTO } from 'src/config/dto/resetPasswordDto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(
    @Body() { user, password }: LoginUserDTO,
    @Res({ passthrough: true }) res: Response,
  ): Promise<loginInterfaceController> {
    const {
      id,
      username,
      permissao,
      id_regional,
      nome_usuario,
      email,
      access_token,
    } = await this.authService.login(user, password);

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Login realizado com sucesso',
      data: { id, username, permissao, id_regional, nome_usuario, email },
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
  @Post('reset-password')
  async resetPassword(
    @Body() { username }: ResetPasswordDTO,
  ): Promise<{ statusCode: number; message: string }> {
    await this.authService.resetPassword(username);

    return {
      statusCode: HttpStatus.OK,
      message: 'Link de redefinição de senha enviado com sucesso',
    };
  }
}
