import React, { useState, useEffect, useMemo } from 'react';
import { Bot, MessageSquare, Loader, Star, Users, Zap, Search, Tag } from 'lucide-react';
import { api } from '../lib/api';

interface Agent {
  agent_id: string;
  user_id: string; // Changed from owner_id to match API response
  agent_name: string;
  personality: string;
  agent_profile_image: string;
  instructions: string;
  prohibition?: string;
  created_at: string;
  modified_at: string;
  function_tools: any[];
  llm_engine: string;
  number_of_message_called: number;
  number_of_users: number;
  agent_main_category?: string;
  agent_sub_category?: string;
  average_rating?: number;
}

interface MarketplaceProps {
  onSelectAgent: (agentId: string) => void;
}

const MAIN_CATEGORIES = [
  "Friend",
  "Entertainment",
  "Healthcare",
  "Beauty",
  "Professional & Business",
  "Tech & Science",
  "Arts, Media & Creativity",
  "Lifestyle & Personal Growth",
  "Food, Travel & Culture",
  "Sports & Outdoor Activities",
  "Social, Community & News",
  "Home, DIY & Lifestyle",
  "Special Interest & Niche Topics",
  "Learning & Education",
  "Events & Social Planning",
  "Miscellaneous"
];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'messages', label: 'Most Active' }
];

export function Marketplace({ onSelectAgent }: MarketplaceProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Friend');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.agent.list(selectedCategory);
        
        if (response.error) {
          throw new Error(response.error);
        }
        
        setAgents(response.agents || []);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, [selectedCategory]);

  const handleSelectAgent = (agent: Agent) => {
    localStorage.setItem('selectedAgentId', agent.agent_id);
    localStorage.setItem('selectedAgentOwnerId', agent.user_id); // Store user_id as owner ID
    localStorage.setItem('selectedAgentName', agent.agent_name);
    localStorage.setItem('selectedAgentImage', agent.agent_profile_image);
    localStorage.setItem('selectedAgentPersonality', agent.personality);
    localStorage.setItem('selectedAgentInstructions', agent.instructions);
    localStorage.setItem('selectedAgentProhibition', agent.prohibition || '');
    localStorage.setItem('selectedAgentMainCategory', agent.agent_main_category || '');
    localStorage.setItem('selectedAgentSubCategory', agent.agent_sub_category || '');
    localStorage.setItem('selectedAgentRating', agent.average_rating?.toString() || '0');
    localStorage.setItem('selectedAgentStats', JSON.stringify({
      messages: agent.number_of_message_called,
      users: agent.number_of_users
    }));
    
    localStorage.setItem('selectedAgent', JSON.stringify(agent));
    
    onSelectAgent(agent.agent_id);
  };

  const filteredAndSortedAgents = useMemo(() => {
    let result = [...agents];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(agent => 
        agent.agent_name.toLowerCase().includes(query) ||
        agent.personality?.toLowerCase().includes(query) ||
        agent.agent_sub_category?.toLowerCase().includes(query)
      );
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'messages':
        result.sort((a, b) => b.number_of_message_called - a.number_of_message_called);
        break;
      case 'popular':
      default:
        result.sort((a, b) => b.number_of_users - a.number_of_users);
        break;
    }

    return result;
  }, [agents, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="h-12 w-12 text-fun-mint animate-spin" />
        <p className="mt-4 text-white text-lg animate-pulse">Loading awesome AI friends... ✨</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fun-card p-8 text-center">
        <p className="text-fun-red text-lg mb-4">Oops! Something went wrong! 🙈</p>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="fun-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search AI friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-full border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300 bg-white"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Tabs */}
        <div className="mt-6 border-b border-primary-100">
          <div className="flex overflow-x-auto hide-scrollbar -mb-px">
            {MAIN_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  selectedCategory === category
                    ? 'border-fun-mint text-fun-mint'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-white">
        <p className="text-lg">
          Showing {filteredAndSortedAgents.length} AI friends
          {selectedCategory && ` in ${selectedCategory}`}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredAndSortedAgents.map((agent) => (
          <div
            key={agent.agent_id}
            className="fun-card group hover:scale-105 transition-transform duration-300 relative"
            onClick={() => handleSelectAgent(agent)}
          >
            <div className="relative aspect-square overflow-hidden rounded-t-xl">
              {agent.agent_profile_image ? (
                <img
                  src={agent.agent_profile_image}
                  alt={agent.agent_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1675252271887-339c521bf7f1?q=80&w=500&auto=format&fit=crop';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-fun-red/10 to-fun-mint/10">
                  <Bot className="h-12 w-12 text-fun-mint" />
                </div>
              )}
              
              {/* Personality Tooltip on Hover */}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                  <p className="text-white text-sm">
                    {agent.personality || "A friendly AI ready to chat!"}
                  </p>
                </div>
              </div>

              {/* Subcategory tag that hides on hover */}
              {agent.agent_sub_category && (
                <div className="absolute top-2 right-2 group-hover:opacity-0 transition-opacity duration-300">
                  <span className="px-2 py-1 text-xs font-medium bg-white/90 rounded-full text-fun-purple flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {agent.agent_sub_category}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3">
              <div className="mb-2">
                <h3 className="font-bold text-gray-900 truncate">
                  {agent.agent_name}
                </h3>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Star className="h-4 w-4 text-fun-yellow fill-fun-yellow" />
                  <span>{agent.average_rating}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{agent.number_of_users}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>{agent.number_of_message_called}</span>
                </div>
                <button
                  className="btn-fun px-2 py-1 text-white text-xs font-medium rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAgent(agent);
                  }}
                >
                  Chat
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSortedAgents.length === 0 && (
        <div className="fun-card p-12 text-center">
          <Bot className="h-20 w-20 text-fun-mint mx-auto mb-6 bounce-fun" />
          <h3 className="text-2xl font-bold text-fun-mint mb-4">
            No AI Friends Found 
            <span className="emoji-float ml-2">🔍</span>
          </h3>
          <p className="text-gray-600 text-lg">
            Try adjusting your filters or search terms to find more friends!
          </p>
        </div>
      )}
    </div>
  );
}