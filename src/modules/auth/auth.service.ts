/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Response as Res, Request as Req } from 'express';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';
import { User } from '../../models/user.schema';
import { Students } from '../../models/student.schema';
import { SALT_ROUNDS, FROM_VERIFY_EMAIL, Role } from '../../constants';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetStudentPasswordDto,
} from './dto/index.dto';
import { addHours } from '../../utils';
import Stripe from 'stripe';
import configs from '../../config';

@Injectable()
export class AuthService {
  private stripe: Stripe;

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Students.name)
    private studentsModel: Model<Students>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {
    this.stripe = new Stripe(configs().STRIPE.SECRET_KEY, {
      apiVersion: '2024-06-20',
    });
  }

  async getMe(uid: string, res: Res): Promise<Res> {
    try {
      let user: any;

      const _user = await this.userModel.findOne({ _id: uid });

      if (_user) {
        // @ts-ignore
        user = _user._doc;
      }

      if (!user) {
        user = await this.studentsModel
          .findOne({ _id: uid })
          .populate('groupId')
          .populate('freeSessions');

        // assigning role as student if it's a student
        user = { ...user._doc, role: 'student' };
      }

      if (!user) {
        throw new BadRequestException("User doesn't exist!");
      }

      return res.json({ user: user, success: true });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async register(body: RegisterDto, res: Res): Promise<Res> {
    try {
      const { name, email, password, phoneNumber, role } = body;
      console.log('Body', body);

      const user = await this.userModel.findOne({ email: email });

      if (user) {
        throw new BadRequestException('User already exists!');
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const date = new Date();
      const expireDate = addHours(date, 1);
      const code = await this._generateUniqueVerificationCode();

      const customer = await this.stripe.customers.create({
        name: name,
        email: email,
      });

      const userToAdd = {
        name,
        email,
        password: hashedPassword,
        phoneNumber,
        role,
        verification: { code: code, expire: expireDate },
        customerId: customer.id,
      };

      let resp = null;

      if (role === 'student') {
        const username = await this._generateUniqueUsername(name);
        resp = await this.studentsModel.create({
          ...userToAdd,
          username,
          isSuperUser: true,
        });
      } else {
        resp = await this.userModel.create({ ...userToAdd, role });
      }

      // const resp = await this.userModel.create({ ...userToAdd });

      const message = `your verification code ${code}`;

      this._sendMail(FROM_VERIFY_EMAIL, resp.email, 'Verify Email', message);

      const authToken = this.jwtService.sign({ _id: resp._id });
      return res
        .set({ 'x-a': authToken })
        .json({ message: 'User registered successfully!', success: true });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async login(body: LoginDto, res: Res): Promise<Res> {
    try {
      const { username, email, password, role } = body;

      let user;

      if (role === 'student' && username) {
        user = await this.studentsModel.findOne({ username: username });
      }

      if (role === 'student' && email) {
        user = await this.studentsModel.findOne({ email: email });
      }

      if (role === 'parent') {
        user = await this.userModel.findOne({ email });
      }

      if (!user) {
        throw new NotFoundException('User not found!');
      }

      const checkPassword = await bcrypt.compare(password, user.password);

      if (!checkPassword) {
        throw new UnauthorizedException('Password is incorrect!');
      }

      const authToken = this.jwtService.sign({ _id: user._id });

      return res
        .set({
          'x-a': authToken,
        })
        .json({
          success: true,
          user: { _id: user._id, verified: user.verified },
        });
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async sendVerificationCode(uid: string, res: Res): Promise<Res> {
    try {
      let isStudent = false;
      let user = await this.userModel.findOne({ _id: uid });

      if (!user) {
        user = await this.studentsModel.findById(uid);
        isStudent = true;
      }

      const code = await this._generateUniqueVerificationCode();

      const message = `your verification code ${code}`;

      const date = new Date();
      const expireDate = addHours(date, 1);

      this._sendMail(FROM_VERIFY_EMAIL, user.email, 'Verify Email', message);

      if (isStudent) {
        await this.studentsModel.findOneAndUpdate(
          { _id: uid },
          { verification: { code: code, expire: expireDate } },
        );
      } else {
        await this.userModel.findOneAndUpdate(
          { _id: uid },
          { verification: { code: code, expire: expireDate } },
        );
      }

      return res.json({ message: 'email sent successfully!', success: true });
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async verifyEmail(uid: string, body: VerifyEmailDto, res: Res): Promise<Res> {
    try {
      const { code } = body;

      let isStudent = false;
      let user;

      user = await this.userModel.findOne({ _id: uid });

      if (!user) {
        user = await this.studentsModel.findOne({ _id: uid });
        isStudent = true;
      }

      //@ts-ignore
      if (+code !== user.verification.code) {
        throw new ConflictException('Code is incorrect!');
      }
      const currentDate = new Date();

      if (currentDate > user.verification.expire) {
        throw new ConflictException('Code is expired!');
      }

      if (isStudent) {
        await this.studentsModel.findOneAndUpdate(
          { _id: uid },
          { verified: true },
        );
      } else {
        await this.userModel.findOneAndUpdate({ _id: uid }, { verified: true });
      }

      return res.json({
        message: 'user verified successfully!',
        success: true,
      });
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async _sendMail(from: string, to: string, subject: string, message: string) {
    await this.mailService.sendMail({
      from,
      to,
      subject,
      text: message,
    });
  }

  async _generateUniqueVerificationCode() {
    // let code;
    // let isUnique = false;

    // while (!isUnique) {

    // const existingCode = await this.userModel.findOne({
    //   verificationCode: code,
    // });
    // if (!existingCode) {
    //   isUnique = true;
    // }
    // }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    return code;
  }

  async _generateUniqueUsername(name: string) {
    let username: string;
    let isUnique = false;

    while (!isUnique) {
      const code = Math.floor(1000 + Math.random() * 900000).toString();
      username = `${name.toLowerCase().replace(' ', '_')}_${code}`;
      const existingCode = await this.studentsModel.findOne({
        username: username,
      });
      if (!existingCode) {
        isUnique = true;
      }
    }

    return username;
  }

  async forgotPassword({ email }: ForgotPasswordDto, res: Res) {
    try {
      let user;
      user = await this.userModel.findOne({
        email,
        role: Role.PARENT,
      });

      if (!user) {
        user = await this.studentsModel.findOne({ email });
        if (!user) {
          throw new NotFoundException('User not found!');
        }
      }

      const authToken = this.jwtService.sign({ _id: user._id });

      // reset password mail service
      this._sendMail(
        FROM_VERIFY_EMAIL,
        user.email,
        'Forget Password',
        `Here is reset password link ${
          configs().FRONTEND_APP_URL
        }/reset-password?token=${authToken}`,
      );

      return res.json({
        success: true,
        message: 'Check your email to recover password!',
      });
    } catch (error) {
      throw new BadRequestException({ success: false, message: error.message });
    }
  }

  async resetPassword(body: ResetPasswordDto, uid: string, req: Req, res: Res) {
    try {
      const { newPassword, confirmPassword } = body;

      let userData;
      //@ts-ignore
      const role = req?.user.roles;

      console.log('role', role);

      if (Role.PARENT === role) {
        userData = await this.userModel.findOne({ _id: uid });
      } else {
        userData = await this.studentsModel.findOne({ _id: uid });
      }

      // sending error if user not found
      if (!userData) {
        throw new NotFoundException({
          success: false,
          message: 'User Not Found!',
        });
      }

      if (newPassword !== confirmPassword) {
        throw new ConflictException({
          success: false,
          message: "Both password doesn't match",
        });
      }

      // creating new password and storing in user's  document
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      if (Role.PARENT === role) {
        await this.userModel.findOneAndUpdate(
          { _id: uid },
          {
            password: hashedPassword,
          },
        );
      } else {
        await this.studentsModel.findOneAndUpdate(
          { _id: uid },
          {
            password: hashedPassword,
          },
        );
      }

      this._sendMail(
        FROM_VERIFY_EMAIL,
        userData.email,
        'Reset Password',
        'Password reset successfully!',
      );

      res.json({
        success: true,
        message: 'Password reset successfully!',
      });
    } catch (error) {
      throw new BadRequestException({ success: false, message: error.message });
    }
  }

  async resetStudentPassword(
    body: ResetStudentPasswordDto,
    uid: string,
    res: Res,
  ) {
    try {
      const { currentPassword, newPassword, userId } = body;

      let user;
      //@ts-ignore
      const role = req?.user.roles;
      // fetching user
      if (role === Role.STUDENT) {
        user = await this.studentsModel.findOne({ _id: userId });
      } else {
        user = await this.studentsModel.findOne({ _id: userId });
      }

      // sending error if user not found
      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'user not found!',
        });
      }

      // validating current password
      const checkPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!checkPassword) {
        throw new UnauthorizedException({
          success: false,
          message: 'Password is incorrect!',
        });
      }

      // creating new password and storing in user's  document
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

      if (role === Role.STUDENT) {
        await this.studentsModel.findOneAndUpdate(
          { _id: userId },
          {
            password: hashedPassword,
            tempPassword: newPassword,
          },
        );
      } else {
        await this.userModel.findOneAndUpdate(
          { _id: userId },
          {
            password: hashedPassword,
          },
        );
      }

      res.json({
        success: true,
        message: 'Password reset successfully!',
      });
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message,
      });
    }
  }
}
