import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  price: number;

  @IsNumber()
  deposit: number;
}

export class CreateOrderDto {
  @IsNumber()
  customerId: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  @IsString()
  @IsOptional()
  status?: string;
}
