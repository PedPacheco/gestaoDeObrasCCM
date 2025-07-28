import {
  HttpException,
  HttpStatus,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { CustomExceptionFilter } from 'src/core/error/customExpection.filter';

describe('CustomExceptionFilter', () => {
  let filter: CustomExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    // Mock do response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock do request
    mockRequest = {
      url: '/test-endpoint',
    };

    // Mock do ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    filter = new CustomExceptionFilter();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with object response containing message array', () => {
      const exception = new HttpException(
        {
          message: [
            'field.name deve ser preenchido',
            'email.format está inválido',
          ],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: [
          'O campo name deve ser preenchido',
          'O campo format está inválido',
        ],
        timestamp: expect.any(String),
      });
    });

    it('should handle HttpException with object response containing string message', () => {
      const exception = new HttpException(
        { message: 'Custom error message' },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: 'Custom error message',
        timestamp: expect.any(String),
      });
    });

    it('should handle HttpException with string response', () => {
      const exception = new HttpException(
        'Direct string message',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        path: '/test-endpoint',
        message: 'Direct string message',
        timestamp: expect.any(String),
      });
    });

    it('should use exception.message when response has no message property', () => {
      const exception = new HttpException(
        { error: 'Some error' },
        HttpStatus.FORBIDDEN,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/test-endpoint',
        message: 'Http Exception',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Default message handling for empty/default Nest messages', () => {
    it('should replace "Bad Request" with custom message', () => {
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: 'Os dados enviados são inválidos. Verifique e tente novamente',
        timestamp: expect.any(String),
      });
    });

    it('should replace "Unauthorized" with custom message', () => {
      const exception = new HttpException(
        'Unauthorized',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.UNAUTHORIZED,
        path: '/test-endpoint',
        message: 'Você não está autorizado a acessar este recurso',
        timestamp: expect.any(String),
      });
    });

    it('should replace "Forbidden" with custom message', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.FORBIDDEN,
        path: '/test-endpoint',
        message: 'Você não tem permissão para realizar esta ação',
        timestamp: expect.any(String),
      });
    });

    it('should replace "Not Found" with custom message', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/test-endpoint',
        message: 'O recurso solicitado não foi encontrado',
        timestamp: expect.any(String),
      });
    });

    it('should replace CONFLICT status with default message', () => {
      const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONFLICT,
        path: '/test-endpoint',
        message: 'Dados já existentes',
        timestamp: expect.any(String),
      });
    });

    it('should handle undefined message', () => {
      const exception = new HttpException(
        { message: undefined },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: 'Os dados enviados são inválidos. Verifique e tente novamente',
        timestamp: expect.any(String),
      });
    });

    it('should handle null message', () => {
      const exception = new HttpException(
        { message: null },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: 'Os dados enviados são inválidos. Verifique e tente novamente',
        timestamp: expect.any(String),
      });
    });

    it('should handle empty object message', () => {
      const exception = new HttpException({ message: {} }, HttpStatus.CONTINUE);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CONTINUE,
        path: '/test-endpoint',
        message: 'Http Exception',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Special case handling', () => {
    it('should handle NOT_FOUND with "Cannot" message', () => {
      const exception = new HttpException(
        'Cannot GET /nonexistent',
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.NOT_FOUND,
        path: '/test-endpoint',
        message: 'O recurso solicitado não foi encontrado',
        timestamp: expect.any(String),
      });
    });

    it('should handle BAD_REQUEST with "Validation failed" message', () => {
      const exception = new HttpException(
        'Validation failed (uuid is expected)',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: 'Os dados enviados são inválidos. Verifique e tente novamente',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Message array transformation', () => {
    it('should transform field validation messages correctly', () => {
      const exception = new HttpException(
        {
          message: [
            'user.name deve ser uma string',
            'profile.email deve ser um email válido',
            'settings.age deve ser um número',
          ],
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: [
          'O campo name deve ser uma string',
          'O campo email deve ser um email válido',
          'O campo age deve ser um número',
        ],
        timestamp: expect.any(String),
      });
    });

    it('should keep original message when regex does not match', () => {
      const exception = new BadRequestException({
        message: ['mensagem sem ponto ou espaço'],
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 400,
        path: '/test-endpoint',
        message: ['O campo mensagem sem ponto ou espaço'],
        timestamp: expect.any(String),
      });
    });

    it('should handle simple field validation messages', () => {
      const exception = new HttpException(
        { message: ['name deve ser preenchido', 'email deve ser válido'] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: [
          'O campo name deve ser preenchido',
          'O campo email deve ser válido',
        ],
        timestamp: expect.any(String),
      });
    });
  });

  describe('Non-HttpException handling', () => {
    it('should handle generic Error', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/test-endpoint',
        message: 'Erro interno no servidor. Tente novamente mais tarde',
        timestamp: expect.any(String),
      });
    });

    it('should handle unknown exception type', () => {
      const exception = 'String exception';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/test-endpoint',
        message: 'Erro interno no servidor. Tente novamente mais tarde',
        timestamp: expect.any(String),
      });
    });

    it('should handle null exception', () => {
      const exception = null;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        path: '/test-endpoint',
        message: 'Erro interno no servidor. Tente novamente mais tarde',
        timestamp: expect.any(String),
      });
    });
  });

  describe('Response format', () => {
    it('should always include statusCode, path, message and timestamp', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0];

      expect(responseCall).toHaveProperty('statusCode');
      expect(responseCall).toHaveProperty('path');
      expect(responseCall).toHaveProperty('message');
      expect(responseCall).toHaveProperty('timestamp');
      expect(responseCall.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should use correct request path', () => {
      mockRequest.url = '/api/users/123';
      const exception = new HttpException('Test', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users/123',
        }),
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle HttpException with non-object, non-string response', () => {
      const exception = new HttpException(
        'Http Exception',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: 'Http Exception',
        timestamp: expect.any(String),
      });
    });

    it('should handle custom status codes with default case', () => {
      const exception = new HttpException('Custom error', 418); // I'm a teapot

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: 418,
        path: '/test-endpoint',
        message: 'Custom error',
        timestamp: expect.any(String),
      });
    });

    it('should handle empty array message', () => {
      const exception = new HttpException(
        { message: [] },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.BAD_REQUEST,
        path: '/test-endpoint',
        message: [],
        timestamp: expect.any(String),
      });
    });
  });
});
