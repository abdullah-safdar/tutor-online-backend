// src/messages/schemas/message.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Message extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  groupId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  senderId: Types.ObjectId;

  @Prop({ type: String, required: true })
  username: string;

  @Prop({ required: true })
  senderRole: string;

  @Prop({})
  message: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ type: [Types.ObjectId], default: [] })
  readBy: Types.ObjectId[];

  @Prop({ type: String, required: false })
  fileUrl?: string;

  @Prop({ type: String, required: false })
  fileType?: string;

  @Prop({ type: String, required: false })
  fileName?: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
