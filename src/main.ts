import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
// import { HttpErrorFilter } from './filters/http-error.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const corsOptions = {
    origin: ['http://localhost:3003'],
    exposedHeaders: 'X-A', // ⬅️ exposes custom response headers
  };

  // app.use(bodyParser.json({ limit: '50mb' }));
  // app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors(corsOptions);
  // app.useGlobalFilters(new HttpErrorFilter());

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/', // Serve files at http://localhost:3000/uploads/
  });

  const config = new DocumentBuilder()
    .setTitle('SAFT Backend App')
    .setDescription('The document describes api for SAFT')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
