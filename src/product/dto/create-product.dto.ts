import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @IsNumber()
  batchId: number;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}
