import { 
  CreateUserRequest, 
  CreateAgentRequest, 
  SendMessageRequest, 
  PointsRequest, 
  PaymentRequest 
} from '../types';

const PROJECT_REF = "yniavfaxbjjpljomtsdn";
const AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaWF2ZmF4YmpqcGxqb210c2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0Nzg3MjAsImV4cCI6MjA1NDA1NDcyMH0.ggxjPj02gBj-p8_L0_4ff-liL6ID3sPhlYmUYzpc420";
export const BASE_URL = `https://${PROJECT_REF}.supabase.co/functions/v1`;

export const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

export const api = {
  BASE_URL,
  headers,
  
  user: {
    create: async (data: CreateUserRequest) => {
      const response = await fetch(`${BASE_URL}/user`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      return response.json();
    },
    getPoints: async (userId: string) => {
      const response = await fetch(`${BASE_URL}/getpoint`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId })
      });
      return response.json();
    }
  },

  agent: {
    create: async (data: CreateAgentRequest) => {
      const response = await fetch(`${BASE_URL}/agent`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      return response.json();
    },
    delete: async (agentId: string, userId: string) => {
      const response = await fetch(`${BASE_URL}/delete-agent`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ agentId, userId })
      });
      return response.json();
    },
    list: async (mainCategory?: string) => {
      const response = await fetch(`${BASE_URL}/listagents`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ mainCategory })
      });
      return response.json();
    },
    creditPoints: async (agentId: string, ownerId: string, points: number, userId: string) => {
      try {
        const response = await fetch(`${BASE_URL}/points`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            userId: ownerId,
            points,
            reason: `Credit to user ${ownerId} (owner of agent ${agentId}) used agent by userid ${userId}`
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to credit points');
        }

        return response.json();
      } catch (error) {
        console.error('Error crediting points:', error);
        throw error;
      }
    }
  },

  message: {
    send: async (data: SendMessageRequest) => {
      // Ensure we have all required fields
      const payload = {
        ...data,
        conversationId: data.conversationId || undefined, // Only include if defined
        model: "anthropic.claude-v2", // Specify model for Bedrock
        temperature: 0.7,
        max_tokens: 1000
      };

      const response = await fetch(`${BASE_URL}/message-bedrock`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      return response.json();
    }
  },

  points: {
    update: async (data: PointsRequest) => {
      try {
        const response = await fetch(`${BASE_URL}/points`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update points');
        }

        return response.json();
      } catch (error) {
        console.error('Error updating points:', error);
        throw error;
      }
    },
    getPackages: async () => {
      const response = await fetch(`${BASE_URL}/get-packages`, {
        method: 'GET',
        headers
      });
      return response.json();
    }
  },

  payment: {
    create: async (data: PaymentRequest) => {
      const response = await fetch(`${BASE_URL}/create-payment`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      return response.json();
    }
  }
};