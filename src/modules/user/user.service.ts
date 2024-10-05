import {
  Injectable,
  BadRequestException,
  NotFoundException,
  // InternalServerErrorException,
  // HttpException,
} from '@nestjs/common';
import { Response as Res } from 'express';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import ShortUniqueId from 'short-unique-id';
import * as bcrypt from 'bcrypt';
import { AddComplaintDto, AddStudentsDto, StudentDto } from './dto/index.dto';
import { User } from '../../models/user.schema';
import { SALT_ROUNDS } from '../../constants';
import { Students } from '../../models/student.schema';
import { Complaints } from '../../models/complaints.schema';
import { Group } from '../../models/group.schema';
import { Sessions } from '../../models/sessions.schema';
import { PaymentService } from '../payment/payment.service';

//import { UserRole, UserStatus } from '../../constants';

@Injectable()
export class UserService {
  constructor(
    private readonly paymentService: PaymentService,
    @InjectModel(User.name)
    private userModel: Model<User>,
    @InjectModel(Students.name)
    private studentsModel: Model<Students>,
    @InjectModel(Complaints.name)
    private complaintsModel: Model<Complaints>,
    @InjectModel(Group.name)
    private groupModel: Model<Group>,
    @InjectModel(Sessions.name)
    private sessionsModel: Model<Sessions>,
  ) {}

  async getStudents(uid: string, res: Res) {
    try {
      const students = await this.studentsModel
        .find({ addedBy: uid })
        .populate('groupId');

      return res.json({
        message: 'students added successfully!',
        students,
        success: true,
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async addStudents(uid: string, body: AddStudentsDto, res: Res) {
    try {
      const { students, proceedToPayment, prices } = body;

      const _students = [];

      const user = await this.userModel.findById(uid);

      for (const student of students) {
        const username = await this._generateUniqueUsername(student.name);
        const randomId = new ShortUniqueId({ length: 12 });
        const password = randomId.rnd();
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        _students.push({
          ...student,
          username,
          password: hashedPassword,
          tempPassword: password,
          addedBy: uid,
        });

        const _student = await this.studentsModel.create({
          ...student,
          username,
          password: hashedPassword,
          tempPassword: password,
          addedBy: uid,
          verified: true,
        });

        await Promise.all(
          student.freeSessionDateIds.map(async (sessionId) => {
            await this.sessionsModel.findOneAndUpdate(
              { _id: sessionId },
              {
                isAssigned: true,
                assignedTo: _student._id,
              },
            );
          }),
        );

        const _members = [_student._id, uid];

        await Promise.all(
          student.subjects.map(async (subject) => {
            const group = await this.groupModel.create({
              members: _members,
              subject,
            });

            await this.studentsModel.findOneAndUpdate(
              { _id: _student._id },
              { $addToSet: { groupId: group._id } },
            );

            await this.userModel.findOneAndUpdate(
              { _id: uid },

              { $addToSet: { groupId: group._id } },
            );
          }),
        );
      }

      let client_secret = null;

      if (proceedToPayment) {
        const res = await this.paymentService.createSetupIntent(
          user._id.toString(),
        );

        client_secret = res.client_secret;
      } else {
        // create inactive subscription
        this.paymentService.createIncompleteSubscription(
          user._id.toString(),
          prices,
        );
      }

      return res.json({
        success: true,
        message: 'students added successfully!',
        students: _students,
        client_secret: client_secret,
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async getSingleStudent(query: { studentId: string }, uid: string) {
    try {
      const user = await this.userModel.findById(uid);

      const { studentId } = query;

      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'User not found!',
        });
      }

      const student = await this.studentsModel.findById(studentId);

      if (!student) {
        throw new NotFoundException({
          success: false,
          message: 'No student found!',
        });
      }

      return {
        success: true,
        student,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException({ message: error.message, success: false });
    }
  }

  async addComplaint(uid: string, body: AddComplaintDto, res: Res) {
    try {
      const { title, message } = body;
      const complaintId = await this._generateUniqueComplaintId('CM');

      await this.complaintsModel.create({
        complaintId: complaintId,
        title,
        message,
        complaintBy: uid,
        status: 'pending',
      });

      return res.json({
        message: 'complaint created successfully!',
        success: true,
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async getComplaints(uid: string, res: Res) {
    try {
      const complaints = await this.complaintsModel.find({ complaintBy: uid });

      return res.json({
        message: 'complaint created successfully!',
        complaints: complaints,
        success: true,
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async onBoardSingleStudent(uid: string, body: StudentDto, res: Res) {
    try {
      const isStudentExists = await this.studentsModel.findById(uid);

      if (!isStudentExists) {
        throw new NotFoundException('Student not found!');
      }

      const _student = await this.studentsModel.findByIdAndUpdate(uid, {
        dateOfBirth: body.dateOfBirth,
        country: body.country,
        city: body.city,
        subjects: body.subjects,
        daysPerWeek: body.daysPerWeek,
        freeSessionDate: body.freeSessionDateIds,
      });

      await Promise.all(
        body.freeSessionDateIds.map(async (sessionId) => {
          await this.sessionsModel.findOneAndUpdate(
            { _id: sessionId },
            {
              isAssigned: true,
              assignedTo: _student._id,
            },
          );
        }),
      );

      await Promise.all(
        body.subjects.map(async (subject) => {
          const group = await this.groupModel.create({
            members: [_student._id],
            subject: subject,
          });

          await this.studentsModel.findOneAndUpdate(
            { _id: _student._id },
            { $addToSet: { groupId: group._id } },
          );
        }),
      );

      res.status(200).json({
        success: true,
        message: 'Updated Successfully!',
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async _generateUniqueUsername(name: string) {
    let username: string;
    let isUnique = false;

    while (!isUnique) {
      const code = Math.floor(1000 + Math.random() * 900000).toString();
      username = `${name}_${code}`;
      const existingCode = await this.studentsModel.findOne({
        username: username,
      });
      if (!existingCode) {
        isUnique = true;
      }
    }

    return username;
  }

  async _generateUniqueComplaintId(name: string) {
    let complaintId: string;
    let isUnique = false;

    while (!isUnique) {
      const code = Math.floor(1000 + Math.random() * 900000).toString();
      complaintId = `${name}_${code}`;

      const existingCode = await this.complaintsModel.findOne({
        complaintId: complaintId,
      });

      if (!existingCode) {
        isUnique = true;
      }
    }

    return complaintId;
  }
}
