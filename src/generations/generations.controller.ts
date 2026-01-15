import {
  Body,
  Controller,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { type Express } from 'express'
import { AuthGuard } from '@nestjs/passport'
import { GenerationsService } from './generations.service'
import { GetUser } from '../auth/get-user.decorator'
import { User } from '../users/user.entity'
import { FileInterceptor } from '@nestjs/platform-express'
import { StartGenerationDto } from './dto/start-generation.dto'
import { writeFile } from 'node:fs/promises'
import { ConfigService } from '@nestjs/config'
import { v4 as uuid } from 'uuid'
import path from 'node:path'

@Controller('generations')
@UseGuards(AuthGuard())
export class GenerationsController {
  constructor(
    private readonly generationsService: GenerationsService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async startGeneration(
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 15 * 1000 * 1000 }),
          new FileTypeValidator({ fileType: 'application/pdf' }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() startGenerationDto: StartGenerationDto,
  ) {
    const tempFileName = `${uuid()}.pdf`
    const tempFilePath = path.join(
      this.configService.getOrThrow<string>('PDFS_PATH'),
      tempFileName,
    )

    await writeFile(tempFilePath, file.buffer)

    await this.generationsService.startGeneration(user, {
      language: startGenerationDto.language,
      speaker: startGenerationDto.speaker,
      pdfFilePath: tempFilePath,
    })
  }
}
