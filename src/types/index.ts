// Database Types
export interface User {
  id: string;
  email: string;
  name?: string;
  registered_date: string;
  last_active_date: string;
  message_count: number;
  remaining_points: number;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  owner_id: string;
  name: string;
  personality: string;
  instructions: string;
  prohibitions?: string;
  function_tools?: any;
  llm_engine: string;
  message_count: number;
  user_count: number;
  is_public: boolean;
  agent_main_category?: string;
  agent_sub_category?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentRating {
  id: string;
  user_id: string;
  agent_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  agent_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  points: number;
  reason: string;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  transaction_id: string;
  points_added?: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

// API Request Types
export interface CreateUserRequest {
  email: string;
  name?: string;
}

export interface CreateAgentRequest {
  userId: string;
  agentName: string;
  personality?: string;
  instructions?: string;
  prohibition?: string;
  agentProfileImage?: string;
  agentMainCategory?: string;
  agentSubCategory?: string;
  functionTools?: any[];
}

export interface SendMessageRequest {
  userId: string;
  agentId: string;
  message: string;
  conversationId?: string;
}

export interface PointsRequest {
  userId: string;
  points: number;
  reason: string;
}

export interface PaymentRequest {
  userId: string;
  amount: number;
  currency?: string;
  payment_method: string;
  transaction_id: string;
  pointsToAdd?: number;
}

export interface RatingRequest {
  userId: string;
  agentId: string;
  rating: number;
  comment?: string;
}