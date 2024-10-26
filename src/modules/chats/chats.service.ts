// src/messages/messages.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message } from '../../models/message.schema';
import { User } from '../../models/user.schema';
import { Students } from '../../models/student.schema';
import { Role } from '../../constants';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Students.name) private studentsModel: Model<Students>,
  ) {}

  async getChatHistory(groupId: Types.ObjectId): Promise<Message[]> {
    return this.messageModel.find({ groupId }).sort({ timestamp: 1 });
  }

  async saveMessage(
    groupId: Types.ObjectId,
    senderId: Types.ObjectId,
    senderRole: string,
    message: string,
  ): Promise<Message> {
    console.log('groupId', groupId);
    console.log('senderId', senderId);

    let user;

    if (Role.STUDENT === senderRole) {
      user = await this.studentsModel.findById(senderId);
    } else {
      user = await this.userModel.findById(senderId);
    }
    const newMessage = new this.messageModel({
      groupId,
      senderId,
      senderRole,
      username: user.name,
      message,
    });
    return newMessage.save();
  }

  async markMessageAsRead(
    messageId: Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<Message> {
    return this.messageModel.findOneAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true },
    );
  }

  // Save a message that contains a file
  async saveMessageWithFile(
    groupId: string,
    senderId: string,
    senderRole: string,
    fileUrl: string,
    fileType: string,
    fileName: string,
  ): Promise<Message> {
    const newMessage = new this.messageModel({
      groupId: new Types.ObjectId(groupId),
      senderId: new Types.ObjectId(senderId),
      senderRole,
      fileUrl,
      fileType,
      fileName,
    });
    return newMessage.save();
  }

  async getMessageWithFile(messageId: string): Promise<Message> {
    const message = this.messageModel.findOne({ _id: messageId });
    return message;
  }
}
