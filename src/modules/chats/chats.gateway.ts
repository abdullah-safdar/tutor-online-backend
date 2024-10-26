import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats.service';
import { Types } from 'mongoose';

@WebSocketGateway({
  cors: { origin: '*' }, // Configure CORS as needed
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly chatsService: ChatsService) {}

  // Handle connection
  async handleConnection(socket: Socket) {
    console.log(`Client connected: ${socket.id}`);
  }

  // Handle disconnection
  async handleDisconnect(socket: Socket) {
    console.log(`Client disconnected: ${socket.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    socket: Socket,
    { groupId, userId }: { groupId: string; userId: string },
  ) {
    try {
      socket.join(groupId);

      const chatHistory = await this.chatsService.getChatHistory(
        new Types.ObjectId(groupId),
      );

      socket.emit('chatHistory', chatHistory);
    } catch (error) {
      console.error(error);
      socket.emit('error', 'Unable to fetch chat history');
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    socket: Socket,
    {
      groupId,
      senderId,
      senderRole,
      message,
    }: {
      groupId: string;
      senderId: string;
      senderRole: string;
      message: string;
      name: string;
    },
  ) {
    try {
      const newMessage = await this.chatsService.saveMessage(
        new Types.ObjectId(groupId),
        new Types.ObjectId(senderId),
        senderRole,
        message,
      );

      socket.to(groupId).emit('newMessage', newMessage);
    } catch (error) {
      console.error(error);
      socket.emit('error', 'Failed to send message');
    }
  }

  @SubscribeMessage('readMessage')
  async handleReadMessage(
    socket: Socket,
    { messageId, userId }: { messageId: string; userId: string },
  ) {
    if (!Types.ObjectId.isValid(messageId) || !Types.ObjectId.isValid(userId)) {
      socket.emit('error', 'Invalid messageId or userId format');
      return;
    }

    try {
      const updatedMessage = await this.chatsService.markMessageAsRead(
        new Types.ObjectId(messageId),
        new Types.ObjectId(userId),
      );

      this.server.emit('messageRead', {
        messageId,
        userId,
        readBy: updatedMessage.readBy,
      });
    } catch (error) {
      console.error(error);
      socket.emit('error', 'Failed to mark message as read');
    }
  }

  @SubscribeMessage('sendFileMessage')
  async handleSendFileMessage(
    socket: Socket,
    {
      groupId,
      messageId,
    }: {
      groupId: string;
      messageId: string;
    },
  ) {
    try {
      const newMessage = await this.chatsService.getMessageWithFile(messageId);

      // Notify all users in the group about the new file message
      this.server.to(groupId).emit('newMessage', newMessage);
    } catch (error) {
      console.error(error);
      socket.emit('error', error.message);
    }
  }
}
