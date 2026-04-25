import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { OrderApplicationService } from '../../application/services/order-application.service';
import { CreateOrderDto } from '../../application/dto/order.dto';
import { Public } from '../../../auth/presentation/decorators/public.decorator';
import { ResponseEnvelopeInterceptor } from '../../../../shared/presentation/interceptors/response-envelope.interceptor';
import { UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@UseInterceptors(ResponseEnvelopeInterceptor)
export class OrderController {
  constructor(private readonly orderService: OrderApplicationService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create order' })
  async create(@Body() dto: CreateOrderDto, @Req() req: Request) {
    const userId = (req as any).user?.id || 'anonymous';
    return this.orderService.createOrder(dto.items, userId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get order' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Public()
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  async cancel(@Param('id') id: string) {
    await this.orderService.cancelOrder(id);
    return { message: 'Order cancelled' };
  }
}