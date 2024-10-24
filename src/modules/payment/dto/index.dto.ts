import { ApiProperty } from '@nestjs/swagger';

class Prices {
  @ApiProperty()
  priceId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  studentName: string;
}

export class CreateSubscriptionDto {
  @ApiProperty()
  prices: Prices[];

  @ApiProperty()
  setupIntentId: string;

  @ApiProperty()
  paymentMethodId?: string;

  @ApiProperty()
  isAppendToStudent: boolean;

  @ApiProperty()
  yearGroup?: string;

  @ApiProperty()
  subjects: string[];
}

export class AttachPaymentMethodToUserDto {
  @ApiProperty()
  setupIntentId: string;
}
