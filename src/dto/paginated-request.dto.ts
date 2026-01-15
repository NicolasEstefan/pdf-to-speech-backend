import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsPositive } from 'class-validator'

export class PaginatedRequestDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  page: number

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  pageSize: number = 10
}
