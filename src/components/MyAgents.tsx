import React, { useState, useEffect } from 'react';
import { Bot, MessageSquare, Loader, ArrowLeft, Plus, Pencil, Trash, Star, Users, Zap, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { EditAgentForm } from './EditAgentForm';

interface Agent {
  agent_id: string;
  agent_name: string;
  personality: string;
  agent_profile_image: string;
  instructions: string;
  prohibition?: string;
  user_id: string;
  created_at: string;
  modified_at: string;
  function_tools: any[];
  llm_engine: string;
  number_of_message_called: number;
  number_of_users: number;
}

interface MyAgentsProps {
  userId: string;
  onSelectAgent: (agentId: string) => void;
  onCreateNew: () => void;
  onBack: () => void;
}

export function MyAgents({ userId, onSelectAgent, onCreateNew, onBack }: MyAgentsProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchAgents = async () => {
    try {
      // Use POST method with userId in body
      const response = await fetch(`${api.BASE_URL}/listagents`, {
        method: 'POST',
        headers: api.headers,
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Filter agents by user ID
      const userAgents = data.agents?.filter((agent: Agent) => agent.user_id === userId) || [];
      setAgents(userAgents);
    } catch (err) {
      console.error('Error fetching my agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [userId]);

  const handleSelectAgent = (agent: Agent) => {
    localStorage.setItem('selectedAgentId', agent.agent_id);
    localStorage.setItem('selectedAgentName', agent.agent_name);
    localStorage.setItem('selectedAgentImage', agent.agent_profile_image);
    localStorage.setItem('selectedAgentPersonality', agent.personality);
    localStorage.setItem('selectedAgentInstructions', agent.instructions);
    localStorage.setItem('selectedAgentProhibition', agent.prohibition || '');
    onSelectAgent(agent.agent_id);
  };

  const handleEditClick = (agent: Agent) => {
    localStorage.setItem('selectedAgentId', agent.agent_id);
    localStorage.setItem('selectedAgentName', agent.agent_name);
    localStorage.setItem('selectedAgentImage', agent.agent_profile_image);
    localStorage.setItem('selectedAgentPersonality', agent.personality);
    localStorage.setItem('selectedAgentInstructions', agent.instructions);
    localStorage.setItem('selectedAgentProhibition', agent.prohibition || '');
    setShowEditForm(true);
  };

  const handleDeleteClick = (agentId: string) => {
    setShowDeleteConfirm(agentId);
  };

  const handleConfirmDelete = async (agentId: string) => {
    setDeleteLoading(true);
    try {
      const response = await api.agent.delete(agentId, userId);
      if (response.error) {
        throw new Error(response.error);
      }
      // Remove the deleted agent from the local state
      setAgents(prev => prev.filter(agent => agent.agent_id !== agentId));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (showEditForm) {
    return (
      <EditAgentForm
        onBack={() => setShowEditForm(false)}
        onSuccess={() => {
          setShowEditForm(false);
          fetchAgents();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-12 w-12 text-fun-mint animate-spin" />
        <p className="mt-4 text-white text-lg animate-pulse">Loading your AI squad... ✨</p>
      </div>
    );
  }

  return (
    <div className="gradient-card rounded-3xl shadow-fun p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-3 hover:bg-fun-red/10 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-fun-red" />
          </button>
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-fun-red float-animation" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-fun-red to-fun-mint bg-clip-text text-transparent">
              My AI Squad ✨
            </h2>
          </div>
        </div>
        <button
          onClick={onCreateNew}
          className="btn-fun px-6 py-3 text-white font-medium rounded-full inline-flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Friend</span>
        </button>
      </div>

      {error && (
        <div className="fun-card p-6 mb-8 border-2 border-fun-red/20">
          <p className="text-fun-red text-lg">Oops! Something went wrong! 🙈</p>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agents.map((agent) => (
          <div
            key={agent.agent_id}
            className="fun-card group hover:rotate-1"
          >
            {showDeleteConfirm === agent.agent_id && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl max-w-xs mx-4 text-center">
                  <AlertTriangle className="h-12 w-12 text-fun-red mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                    Delete {agent.agent_name}?
                  </h4>
                  <p className="text-gray-600 mb-6">
                    This action cannot be undone. Are you sure you want to delete this AI friend?
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                      disabled={deleteLoading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmDelete(agent.agent_id)}
                      className="flex-1 px-4 py-2 text-white bg-fun-red rounded-full hover:bg-fun-red/90 transition-colors"
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative h-48 overflow-hidden rounded-t-2xl">
              {agent.agent_profile_image ? (
                <img
                  src={agent.agent_profile_image}
                  alt={agent.agent_name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1675252271887-339c521bf7f1?q=80&w=500&auto=format&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-fun-red/10 to-fun-mint/10">
                  <Bot className="h-20 w-20 text-fun-mint float-animation" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="badge-fun bg-white/90 flex items-center space-x-1">
                  <Users className="h-4 w-4 text-fun-red" />
                  <span className="text-fun-red">{agent.number_of_users} friends</span>
                </div>
                <div className="badge-fun bg-white/90 flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4 text-fun-mint" />
                  <span className="text-fun-mint">{agent.number_of_message_called} chats</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-fun-red to-fun-mint bg-clip-text text-transparent">
                  {agent.agent_name}
                </h3>
                <Star className="h-5 w-5 text-fun-yellow bounce-fun" />
              </div>
              
              <p className="text-gray-600 mb-6 line-clamp-2 text-lg">
                {agent.personality || 'Ready to be your friend! ✨'}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleSelectAgent(agent)}
                  className="flex-1 btn-fun py-3 text-white font-medium rounded-full inline-flex items-center justify-center space-x-2"
                >
                  <Zap className="h-5 w-5" />
                  <span>Chat!</span>
                </button>
                <button
                  onClick={() => handleEditClick(agent)}
                  className="btn-fun py-3 px-4 text-white font-medium rounded-full inline-flex items-center justify-center"
                  aria-label="Edit agent"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteClick(agent.agent_id)}
                  className="bg-fun-red/10 hover:bg-fun-red/20 py-3 px-4 text-fun-red font-medium rounded-full inline-flex items-center justify-center transition-colors"
                  aria-label="Delete agent"
                >
                  <Trash className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="fun-card p-12 text-center">
          <Bot className="h-20 w-20 text-fun-mint mx-auto mb-6 bounce-fun" />
          <h3 className="text-2xl font-bold text-fun-mint mb-4">
            No AI Friends Yet! 
            <span className="emoji-float ml-2">🚀</span>
          </h3>
          <p className="text-gray-600 text-lg mb-8">
            Time to create your first awesome AI friend!
          </p>
          <button
            onClick={onCreateNew}
            className="btn-fun px-8 py-4 text-white font-medium rounded-full inline-flex items-center justify-center space-x-2 text-lg"
          >
            <Plus className="h-6 w-6" />
            <span>Create My First Friend!</span>
          </button>
        </div>
      )}
    </div>
  );
}