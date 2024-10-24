import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ required: true, default: Date.now() })
  dateTime: Date;

  @Prop({ default: false })
  checkIn: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Students' })
  attendant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  parent: Types.ObjectId;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
