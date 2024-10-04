import { InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common/interfaces';
import { Request, Response } from 'express';
import { InternalServerErrorExceptionFilter } from 'src/utils/internalServerError.filter';

describe('InternalServerErrorExceptionFilter', () => {
  let filter: InternalServerErrorExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    filter = new InternalServerErrorExceptionFilter();

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
    const exception = new InternalServerErrorException();

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: mockRequest.url,
      message: 'Erro ao processar a solicitação',
    });
  });
});
