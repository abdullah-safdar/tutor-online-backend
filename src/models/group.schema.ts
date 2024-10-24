import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Group extends Document {
  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  members: Types.ObjectId[];

  @Prop({ required: true })
  yearGroup: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const GroupSchema = SchemaFactory.createForClass(Group);
