import { Controller, Get, Response, UseGuards } from '@nestjs/common';
import { Response as Res } from 'express';
import { AttendanceService } from './attendance.service';
import { RolesGuard } from '../../guard/roles.guard';
import { Roles } from '../../decorator/role.decorator';
import { Role } from '../../constants';
import { Uid } from '../../decorator/uid.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(Role.PARENT)
  @UseGuards(RolesGuard)
  @Get()
  async getStudentsAttendance(@Uid() uid: string, @Response() res: Res) {
    return this.attendanceService.getStudentsAttendance(uid, res);
  }

  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  @Get('/single')
  async getSingleStudentAttendance(@Uid() uid: string, @Response() res: Res) {
    return this.attendanceService.getSingleStudentAttendance(uid, res);
  }

  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  @Get('/mark-attendance')
  async markStudentAttendance(@Uid() uid: string, @Response() res: Res) {
    return this.attendanceService.markStudentAttendance(uid, res);
  }
}
