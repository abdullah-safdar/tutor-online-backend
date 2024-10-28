export interface MulterS3File extends Express.Multer.File {
  location: string; // URL of the file on S3
  key: string;
}
