import {
  BadRequestException,
  Body,
  Controller,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Query,
  StreamableFile,
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
import { GetGenerationsDto } from './dto/get-generations.dto'
import { createReadStream } from 'node:fs'

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
      originalFileName: file.originalname,
    })
  }

  @Get('/')
  async getGenerations(
    @GetUser() user: User,
    @Query() getGenerationsDto: GetGenerationsDto,
  ) {
    return await this.generationsService.getGenerations(user, getGenerationsDto)
  }

  @Get('/:id/audio')
  async getGeneration(@GetUser() user: User, @Param('id') id: string) {
    const generation = await this.generationsService.getGenerationById(user, id)
    if (!generation) {
      throw new NotFoundException()
    }

    if (!generation.audio) {
      throw new BadRequestException('The generation has no associated audio')
    }

    const filePath = generation.audio.filePath
    const file = createReadStream(filePath)
    return new StreamableFile(file, {
      disposition: `attachment; filename="${generation.title}.wav"`,
    })
  }
}
