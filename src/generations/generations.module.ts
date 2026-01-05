import { Module } from '@nestjs/common'
import { PdfService } from './pdf/pdf.service'

@Module({
  providers: [PdfService],
})
export class GenerationsModule {}
