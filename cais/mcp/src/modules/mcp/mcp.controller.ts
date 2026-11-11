import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  All,
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthRequest } from '../../common/guards/auth.guard';
import { McpService } from './mcp.service';

@ApiExcludeController()
@Controller()
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post()
  async handle(
    @Req() req: AuthRequest,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    const server = this.mcpService.create(String(req.user.sub));
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  }

  @All()
  other() {
    throw new HttpException(
      'метод не поддерживается',
      HttpStatus.METHOD_NOT_ALLOWED,
    );
  }
}
