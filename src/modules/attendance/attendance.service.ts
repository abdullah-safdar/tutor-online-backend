import { Injectable, BadRequestException } from '@nestjs/common';
import { Response as Res } from 'express';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Attendance } from '../../models/attendance.schema';
import { Students } from '../../models/student.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private attendanceModel: Model<Attendance>,
    @InjectModel(Students.name)
    private studentsModel: Model<Students>,
  ) {}

  async getStudentsAttendance(uid: string, res: Res) {
    try {
      const attendances = await this.attendanceModel
        .find({ parent: uid })
        .populate('attendant');

      return res.json({
        attendances,
        success: true,
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async getSingleStudentAttendance(uid: string, res: Res) {
    try {
      const attendance = await this.attendanceModel
        .find({ attendant: uid })
        .populate('attendant');

      return res.json({
        attendance,
        success: true,
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }

  async markStudentAttendance(uid: string, res: Res) {
    try {
      const student = await this.studentsModel.findOne({ _id: uid });

      await this.attendanceModel.create({
        checkIn: true,
        attendant: uid,
        parent: student.addedBy,
      });

      return res.json({
        message: 'attendance marked successfully!',
        success: true,
      });
    } catch (err) {
      console.log(err);
      throw new BadRequestException({ message: err.message, success: false });
    }
  }
}
