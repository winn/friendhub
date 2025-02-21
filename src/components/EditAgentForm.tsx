import React, { useState, useEffect } from 'react';
import { Bot, Save, X, Image as ImageIcon, ArrowLeft, Sparkles, MessageSquare, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { api } from '../lib/api';

interface EditAgentFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

interface ChannelConfig {
  id?: string;
  agent_id?: string;
  channel_type: string;
  config: {
    accessToken?: string;
    secretToken?: string;
    webhook_setting?: string;
    otherConfigKey?: string;
  };
  webhook_url?: string;
  created_at?: string;
  updated_at?: string;
}

export function EditAgentForm({ onBack, onSuccess }: EditAgentFormProps) {
  // Get agent data from localStorage
  const agentId = localStorage.getItem('selectedAgentId') || '';
  const initialName = localStorage.getItem('selectedAgentName') || '';
  const initialImage = localStorage.getItem('selectedAgentImage') || '';
  const initialPersonality = localStorage.getItem('selectedAgentPersonality') || '';
  const initialInstructions = localStorage.getItem('selectedAgentInstructions') || '';
  const initialProhibition = localStorage.getItem('selectedAgentProhibition') || '';

  const [formData, setFormData] = useState({
    name: initialName,
    personality: initialPersonality,
    instructions: initialInstructions,
    prohibition: initialProhibition,
    imageUrl: initialImage,
  });

  const [channelConfig, setChannelConfig] = useState<ChannelConfig>({
    channel_type: 'LINE',
    config: {
      accessToken: '',
      secretToken: '',
      webhook_setting: 'enabled',
      otherConfigKey: 'value'
    },
    webhook_url: `${api.BASE_URL}/line-webhook/${agentId}`
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [showChannelSettings, setShowChannelSettings] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch existing channel config
  useEffect(() => {
    const fetchChannelConfig = async () => {
      try {
        const response = await fetch(`${api.BASE_URL}/channel-config`, {
          method: 'POST',
          headers: api.headers,
          body: JSON.stringify({
            agentId,
            channelType: 'LINE'
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch channel configuration');
        }

        const data = await response.json();
        console.log('Channel config response:', data);

        if (data.data && data.data[0]) {
          setChannelConfig(data.data[0]);
        } else if (data.config) {
          setChannelConfig({
            ...data.config,
            channel_type: 'LINE',
            config: {
              ...data.config.config,
              webhook_setting: 'enabled',
              otherConfigKey: 'value'
            },
            webhook_url: `${api.BASE_URL}/line-webhook/${agentId}`
          });
        }
      } catch (err) {
        console.error('Error fetching channel config:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch channel configuration');
      }
    };

    if (agentId && showChannelSettings) {
      fetchChannelConfig();
    }
  }, [agentId, showChannelSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Update agent details
      const agentResponse = await fetch(`${api.BASE_URL}/modify-agent`, {
        method: 'PATCH',
        headers: api.headers,
        body: JSON.stringify({
          agentId,
          agentName: formData.name,
          agentProfileImage: formData.imageUrl,
          personality: formData.personality,
          instructions: formData.instructions,
          prohibition: formData.prohibition,
          functionTools: []
        })
      });

      if (!agentResponse.ok) {
        const data = await agentResponse.json();
        throw new Error(data.error || 'Failed to update agent');
      }

      // Update channel config if changed
      if (showChannelSettings && (channelConfig.config.accessToken || channelConfig.config.secretToken)) {
        const channelResponse = await fetch(`${api.BASE_URL}/channel-config`, {
          method: 'POST',
          headers: api.headers,
          body: JSON.stringify({
            agentId,
            channelType: 'LINE',
            config: {
              accessToken: channelConfig.config.accessToken,
              secretToken: channelConfig.config.secretToken,
              webhook_setting: 'enabled',
              otherConfigKey: 'value'
            }
          })
        });

        if (!channelResponse.ok) {
          const data = await channelResponse.json();
          throw new Error(data.error || 'Failed to update channel configuration');
        }
      }

      // Update localStorage
      localStorage.setItem('selectedAgentName', formData.name);
      localStorage.setItem('selectedAgentImage', formData.imageUrl);
      localStorage.setItem('selectedAgentPersonality', formData.personality);
      localStorage.setItem('selectedAgentInstructions', formData.instructions);
      localStorage.setItem('selectedAgentProhibition', formData.prohibition);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      console.error('Error updating agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'imageUrl') {
      setImagePreviewError(false);
    }
  };

  const handleChannelConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setChannelConfig(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [name]: value
      }
    }));
  };

  const handleCopyWebhook = async () => {
    if (channelConfig.webhook_url) {
      await navigator.clipboard.writeText(channelConfig.webhook_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="gradient-card rounded-2xl shadow-fun p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-fun-red/10 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-fun-red" />
          </button>
          <div className="flex items-center space-x-3">
            <Sparkles className="h-7 w-7 text-fun-mint float-animation" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-fun-red to-fun-mint bg-clip-text text-transparent">
              Edit AI Friend ✨
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Image Preview and URL Field */}
        <div className="flex items-start space-x-6">
          <div className="w-40 h-40 rounded-2xl border-3 border-primary-200 overflow-hidden flex items-center justify-center bg-gradient-to-r from-primary-50 to-fun-purple/5">
            {formData.imageUrl && !imagePreviewError ? (
              <img
                src={formData.imageUrl}
                alt="Agent preview"
                className="w-full h-full object-cover"
                onError={() => setImagePreviewError(true)}
              />
            ) : (
              <div className="flex flex-col items-center text-primary-400">
                <ImageIcon className="h-12 w-12 mb-2 float-animation" />
                <span className="text-sm">Add an avatar!</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
              placeholder="Paste image URL here..."
            />
            {imagePreviewError && (
              <p className="mt-2 text-sm text-red-600">
                Oops! That image didn't work. Try another one! 🖼️
              </p>
            )}
          </div>
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Agent Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
            placeholder="Give your AI friend a cool name!"
          />
        </div>

        {/* Personality Field */}
        <div>
          <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-2">
            Personality
          </label>
          <textarea
            id="personality"
            name="personality"
            value={formData.personality}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
            placeholder="What's their vibe? Fun? Silly? Smart? 🌟"
          />
        </div>

        {/* Instructions Field */}
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
            Instructions
          </label>
          <textarea
            id="instructions"
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
            placeholder="What should they help with? 🤔"
          />
        </div>

        {/* Prohibitions Field */}
        <div>
          <label htmlFor="prohibition" className="block text-sm font-medium text-gray-700 mb-2">
            Prohibitions
          </label>
          <textarea
            id="prohibition"
            name="prohibition"
            value={formData.prohibition}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
            placeholder="What topics should they avoid? 🚫"
          />
        </div>

        {/* Channel Settings Section */}
        <div className="border-t border-primary-100 pt-6">
          <button
            type="button"
            onClick={() => setShowChannelSettings(!showChannelSettings)}
            className="flex items-center space-x-2 text-fun-mint hover:text-fun-mint/80 transition-colors"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Channel Settings</span>
          </button>

          {showChannelSettings && (
            <div className="mt-4 space-y-6">
              <div className="fun-card p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" alt="LINE" className="h-8 w-8" />
                  <h3 className="text-xl font-bold text-gray-900">LINE Integration</h3>
                </div>

                <div className="space-y-6">
                  {/* Webhook URL - Show this first */}
                  <div className="bg-primary-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Webhook URL
                      </label>
                      <button
                        type="button"
                        onClick={handleCopyWebhook}
                        className="flex items-center space-x-2 text-fun-mint hover:text-fun-mint/80 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span className="text-sm">Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={channelConfig.webhook_url || `${api.BASE_URL}/line-webhook/${agentId}`}
                        className="flex-1 rounded-xl border-2 border-primary-200 bg-white font-mono text-sm py-2 px-3"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">
                      Copy this URL and paste it in your LINE Channel settings under Messaging API {'>'} Webhook URL
                    </p>
                  </div>

                  {/* Access Token */}
                  <div>
                    <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-2">
                      Channel Access Token
                    </label>
                    <input
                      type="password"
                      id="accessToken"
                      name="accessToken"
                      value={channelConfig.config.accessToken || ''}
                      onChange={handleChannelConfigChange}
                      className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
                      placeholder="Enter your LINE Channel Access Token"
                    />
                  </div>

                  {/* Secret Token */}
                  <div>
                    <label htmlFor="secretToken" className="block text-sm font-medium text-gray-700 mb-2">
                      Channel Secret Token
                    </label>
                    <input
                      type="password"
                      id="secretToken"
                      name="secretToken"
                      value={channelConfig.config.secretToken || ''}
                      onChange={handleChannelConfigChange}
                      className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
                      placeholder="Enter your LINE Channel Secret"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-4 rounded-xl">
            Yay! Your AI friend has been updated! ✨
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 rounded-full border-2 border-fun-red text-fun-red font-medium hover:bg-fun-red/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || success}
            className="btn-fun px-8 py-3 rounded-full text-white font-medium text-lg inline-flex items-center space-x-2"
          >
            {isLoading ? (
              'Updating...'
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}