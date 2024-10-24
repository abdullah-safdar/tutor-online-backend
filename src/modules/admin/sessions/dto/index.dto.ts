import { ApiProperty } from '@nestjs/swagger';

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
  yearGroup: string;

  @ApiProperty()
  subjects: string[];

  @ApiProperty()
  daysPerWeek: number;

  @ApiProperty()
  freeSessionDateId: [string];
}

export class AddSessionsDto {
  @ApiProperty()
  sessions: {
    date: string;
    time: string;
    type: string;
    isAssigned: boolean;
  }[];
}
