import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailerModule } from '@nestjs-modules/mailer';
import { User, UserSchema } from './models/user.schema';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { Students, StudentsSchema } from './models/student.schema';
import { ConfigModule } from '@nestjs/config';
import { AuthMiddleware } from './middlewares';
import { ChatsModule } from './modules/chats/chats.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AdminPaymentModule } from './modules/admin/payment/payment.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SessionsModule } from './modules/admin/sessions/sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Students.name, schema: StudentsSchema },
    ]),
    MailerModule.forRoot({
      transport: {
        host: process.env.EMAIL_HOST,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      },
    }),
    AuthModule,
    UserModule,
    ChatsModule,
    PaymentModule,
    AdminPaymentModule,
    AttendanceModule,
    TasksModule,
    SessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: '/auth/login', method: RequestMethod.POST },
        { path: '/auth/register', method: RequestMethod.POST },
        { path: '/auth/forgot-password', method: RequestMethod.POST },
        { path: '/payment/prices', method: RequestMethod.ALL },
        { path: '/payment/products', method: RequestMethod.ALL },
        { path: '/admin/payment/products', method: RequestMethod.ALL },
        { path: '/admin/payment/prices', method: RequestMethod.ALL },
        { path: '/admin/prices', method: RequestMethod.ALL },
        { path: '/payment/webhook', method: RequestMethod.POST },
        { path: '/sessions', method: RequestMethod.POST },
      )
      .forRoutes({ path: '/*', method: RequestMethod.ALL });
  }
}
