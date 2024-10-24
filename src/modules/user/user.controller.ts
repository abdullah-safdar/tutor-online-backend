import {
  Controller,
  Get,
  Post,
  Body,
  Response,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Response as Res } from 'express';
import { Uid } from '../../decorator/uid.decorator';
import { UserService } from './user.service';
import {
  AddStudentsDto,
  AddComplaintDto,
  StudentDto,
  SessionSwapDto,
  UpdateProfileDto,
  AppendYearGroupSubjectsDto,
} from './dto/index.dto';

import { RolesGuard } from '../../guard/roles.guard';
import { Roles } from '../../decorator/role.decorator';
import { Role } from '../../constants';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.PARENT)
  @UseGuards(RolesGuard)
  @Get('/get-students')
  async getStudents(@Uid() uid: string, @Response() res: Res) {
    return this.userService.getStudents(uid, res);
  }

  @Roles(Role.PARENT)
  @UseGuards(RolesGuard)
  @Post('/add-students')
  async addStudents(
    @Uid() uid: string,
    @Body() addStudentsDto: AddStudentsDto,
    @Response() res: Res,
  ) {
    return this.userService.addStudents(uid, addStudentsDto, res);
  }

  @UseGuards(RolesGuard)
  @Get('/get-student')
  async getStudent(@Uid() uid: string, @Query() query: { studentId: string }) {
    return this.userService.getSingleStudent(query, uid);
  }

  @Roles(Role.PARENT, Role.STUDENT)
  @UseGuards(RolesGuard)
  @Get('/get-complaints')
  async getComplaints(@Uid() uid: string, @Response() res: Res) {
    return this.userService.getComplaints(uid, res);
  }

  @Roles(Role.PARENT, Role.STUDENT)
  @UseGuards(RolesGuard)
  @Post('/add-complaint')
  async addComplaints(
    @Uid() uid: string,
    @Body() addComplaintDto: AddComplaintDto,
    @Response() res: Res,
  ) {
    return this.userService.addComplaint(uid, addComplaintDto, res);
  }

  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  @Post('/on-board-single-student')
  async onBoardSingleStudent(
    @Uid() uid: string,
    @Body() studentDto: StudentDto,
    @Response() res: Res,
  ) {
    return this.userService.onBoardSingleStudent(uid, studentDto, res);
  }

  @Roles(Role.PARENT, Role.STUDENT)
  @UseGuards(RolesGuard)
  @Post('/session-swaps')
  async createSessionSwapRequest(
    @Uid() uid: string,
    @Body() body: SessionSwapDto,
  ) {
    return this.userService.createSessionSwapRequest(uid, body);
  }

  @Roles(Role.PARENT, Role.STUDENT)
  @UseGuards(RolesGuard)
  @Get('/session-swaps')
  async getSessionSwapRequest(@Uid() uid: string) {
    return this.userService.getSessionSwapRequest(uid);
  }

  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  @Post('/update-profile')
  async updateProfile(@Uid() uid: string, @Body() body: UpdateProfileDto) {
    return this.userService.updateProfile(uid, body);
  }

  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  @Post('/student/append-yeargroups-subjects')
  async appendYearGroupsSubjects(
    @Body() body: AppendYearGroupSubjectsDto,
    @Uid() uid: string,
  ) {
    return this.userService.appendYearGroupsSubjects(body, uid);
  }
}
