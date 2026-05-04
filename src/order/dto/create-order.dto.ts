import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNumber()
  customerId: number;

  @IsString()
  @IsOptional()
  note?: string;
}
