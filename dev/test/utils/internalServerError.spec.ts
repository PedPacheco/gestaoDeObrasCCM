import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { Request, Response } from 'express';
import { CustomExceptionFilter } from 'src/common/error/customExpection.filter';

describe('InternalServerErrorExceptionFilter', () => {
  let filter: CustomExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    filter = new CustomExceptionFilter();

    mockRequest = {
      url: '/test-url',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse as Response,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle InternalServerErrorException and return expected response', () => {
    const exception = new Error();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: '/test-url',
      message: 'Erro interno no servidor. Tente novamente mais tarde',
      timestamp: expect.any(String),
    });
  });

  it('should handle BadRequestExpection and return expected response', () => {
    const exception = new BadRequestException();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      path: '/test-url',
      message: 'Os dados enviados são inválidos. Verifique e tente novamente',
      timestamp: expect.any(String),
    });
  });

  it('should handle Unauthorized and return expected response', () => {
    const exception = new UnauthorizedException();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.UNAUTHORIZED,
      path: '/test-url',
      message: 'Você não está autorizado a acessar este recurso',
      timestamp: expect.any(String),
    });
  });

  it('should handle Forbidden expection and return expected response', () => {
    const exception = new ForbiddenException();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      path: '/test-url',
      message: 'Você não tem permissão para realizar esta ação',
      timestamp: expect.any(String),
    });
  });

  it('should handle NotFound expection and return expected response', () => {
    const exception = new NotFoundException();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      path: '/test-url',
      message: 'O recurso solicitado não foi encontrado',
      timestamp: expect.any(String),
    });
  });

  it('should handle HttpException with custom message', () => {
    const exception = new HttpException(
      { message: 'Custom Error Message', error: 'Conflict' },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.CONFLICT,
      path: '/test-url',
      message: 'Custom Error Message',
      timestamp: expect.any(String),
    });
  });
});
