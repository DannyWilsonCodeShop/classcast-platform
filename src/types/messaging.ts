export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'student' | 'instructor' | 'admin';
  recipientId: string;
  recipientName: string;
  recipientRole: 'student' | 'instructor' | 'admin';
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  conversationId: string;
  courseId?: string;
  assignmentId?: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  courseId?: string;
  assignmentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  name: string;
  role: 'student' | 'instructor' | 'admin';
  email: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface CreateMessageRequest {
  recipientId: string;
  subject: string;
  content: string;
  courseId?: string;
  assignmentId?: string;
  attachments?: File[];
}

export interface MessageNotification {
  id: string;
  messageId: string;
  recipientId: string;
  type: 'new_message' | 'mention' | 'assignment_related';
  title: string;
  content: string;
  isRead: boolean;
  timestamp: string;
  courseId?: string;
  assignmentId?: string;
}

export interface EmailNotificationData {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject: string;
  messageContent: string;
  conversationUrl: string;
  courseName?: string;
  assignmentTitle?: string;
}
