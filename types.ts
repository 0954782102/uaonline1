
export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  isAdmin: boolean;
  registeredAt: number;
  lastUsernameChange?: number;
  lastNameChange?: number;
  stats: {
    posts: number;
    likesReceived: number;
  };
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  server: '01' | '02' | '03' | '04' | '05' | 'all';
  text: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  likes: string[]; // User IDs
  views: string[]; // Unique User/Session IDs
  comments: Comment[];
  createdAt: number;
  moderatorComment?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approval' | 'rejection' | 'system';
  read: boolean;
  createdAt: number;
}
