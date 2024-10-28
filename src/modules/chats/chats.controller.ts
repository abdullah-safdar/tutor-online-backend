import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
// import * as multerS3 from 'multer-s3';
// import * as AWS from 'aws-sdk';
import { ChatsService } from './chats.service';
import { MulterS3File } from '../../types';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('upload')
  //   @UseInterceptors(
  //     FileInterceptor('file', {
  //       storage: multerS3({
  //         s3: new AWS.S3({
  //           accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //           secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  //           region: process.env.AWS_REGION,
  //         }),
  //         bucket: process.env.AWS_S3_BUCKET_NAME,
  //         acl: 'public-read',
  //         metadata: (req, file, cb) => {
  //           cb(null, { fieldName: file.fieldname });
  //         },
  //         key: (req, file, cb) => {
  //           const fileName = `${Date.now().toString()}-${file.originalname}`;
  //           cb(null, fileName);
  //         },
  //       }),
  //     }),
  //   )
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Local directory where files will be stored
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: MulterS3File,
    @Body('groupId') groupId: string,
    @Body('senderId') senderId: string,
    @Body('senderRole') senderRole: string,
    @Body('username') username: string,
  ) {
    const fileUrl = `http://localhost:4000/uploads/${file.filename}`; //
    // const fileUrl = file.location;

    console.log(groupId, senderId, senderRole);
    const message = await this.chatsService.saveMessageWithFile(
      groupId,
      senderId,
      senderRole,
      username,
      fileUrl,
      file.mimetype,
      file.originalname,
    );

    return { message };
  }
}
