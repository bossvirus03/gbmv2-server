import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsEnum(['AVAILABLE', 'DEPOSIT', 'SOLD'])
  status?: 'AVAILABLE' | 'DEPOSIT' | 'SOLD';

  @IsOptional()
  @IsNumber()
  price?: number;
}
