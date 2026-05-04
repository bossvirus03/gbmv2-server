import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  jpyAmount: number;

  @IsNumber()
  exchangeRate: number;

  @IsNumber()
  domesticShipJpy: number;

  @IsNumber()
  shippingToVn: number;

  @IsNumber()
  serviceFeeRate: number;

  @IsString()
  @IsOptional()
  url?: string;
}
