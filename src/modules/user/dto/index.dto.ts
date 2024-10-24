import { ApiProperty } from '@nestjs/swagger';

class YearGroups {
  yearGroup: string;
  subjects: string[];
}

export class StudentDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  dateOfBirth: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  yearGroups: YearGroups[];

  @ApiProperty()
  daysPerWeek: number;

  @ApiProperty()
  priceId: string;

  @ApiProperty()
  freeSessions: string[];

  @ApiProperty()
  proceedToPayment: boolean;
}

class Prices {
  @ApiProperty()
  priceId: string;

  @ApiProperty()
  studentId: string;
}

export class AddStudentsDto {
  @ApiProperty()
  students: [StudentDto];

  @ApiProperty()
  proceedToPayment: boolean;

  @ApiProperty()
  prices: Prices[];
}

export class AddComplaintDto {
  @ApiProperty()
  title: string;

  @ApiProperty()
  message: string;
}

export class SessionSwapDto {
  // currentSession: "2024-10-10T09:00:00.000Z"
  // reason: "fsdfdsfdsfsdf"
  // requestFor: "makeover"
  // student: "6701865bdad2dce81c135945"
  // swapSession: "2024-10-09T08:00:00.000Z"

  @ApiProperty()
  currentSession: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  requestFor: string;

  @ApiProperty()
  student: string;

  @ApiProperty()
  swapSession: string;
}

export class UpdateProfileDto {
  enableNotification: boolean;
}

export class AppendYearGroupSubjectsDto {
  yearGroup: string;
  subjects: string[];
  priceId: string;
  studentId: string;
  setupIntentId: string;
}
