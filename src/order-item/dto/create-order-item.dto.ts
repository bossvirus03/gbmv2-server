import { IsNumber } from 'class-validator';

export class CreateOrderItemDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  productId: number;

  @IsNumber()
  price: number;

  @IsNumber()
  deposit: number;
}
