import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { ProductApplicationService } from '../../application/services/product-application.service';
import { CreateProductDto, UpdateProductDto, AdjustStockDto } from '../../application/dto/product.dto';
import { Public } from '../../../../modules/auth/presentation/decorators/public.decorator';
import { ResponseEnvelopeInterceptor } from '../../../../shared/presentation/interceptors/response-envelope.interceptor';
import { UseInterceptors, UseGuards } from '@nestjs/common';

@ApiTags('Products')
@Controller('products')
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@UseInterceptors(ResponseEnvelopeInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductApplicationService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products' })
  async findAll(@Query() query: { categoryId?: string; isActive?: boolean; page?: number; limit?: number }) {
    return this.productService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product' })
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findById(id);
    if (!product) throw new Error('Product not found');
    return product;
  }

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create product' })
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Public()
  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  async delete(@Param('id') id: string) {
    await this.productService.delete(id);
    return { message: 'Product deleted' };
  }

  @Public()
  @Post(':id/stock')
  @ApiOperation({ summary: 'Adjust stock' })
  async adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.productService.adjustStock(id, dto.quantity);
  }
}
