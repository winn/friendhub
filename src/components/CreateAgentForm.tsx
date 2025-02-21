import React, { useState, useEffect } from 'react';
import { Bot, Save, X, Image as ImageIcon, ArrowLeft, Sparkles, Wand2 } from 'lucide-react';
import { api } from '../lib/api';

interface CreateAgentFormProps {
  userId: string;
  onBack: () => void;
}

interface CategoryData {
  [key: string]: string[];
}

const DEFAULT_CATEGORIES = {
  'Friend': ['Casual Friend', 'Best Friend', 'Mentor', 'Confidant'],
  'Entertainment': ['Gaming Buddy', 'Movie Expert', 'Music Companion', 'Storyteller'],
  'Healthcare': ['Wellness Coach', 'Mental Health Support', 'Fitness Trainer', 'Nutrition Guide'],
  'Beauty': ['Style Advisor', 'Makeup Artist', 'Skincare Expert', 'Fashion Consultant'],
  'Professional & Business': ['Career Coach', 'Business Mentor', 'Productivity Expert', 'Leadership Guide'],
  'Tech & Science': ['Tech Support', 'Science Tutor', 'Coding Buddy', 'AI Expert'],
  'Arts, Media & Creativity': ['Art Critic', 'Writing Coach', 'Creative Muse', 'Design Advisor'],
  'Lifestyle & Personal Growth': ['Life Coach', 'Meditation Guide', 'Self-Help Guru', 'Motivator'],
  'Food, Travel & Culture': ['Food Expert', 'Travel Guide', 'Culture Expert', 'Recipe Advisor'],
  'Sports & Outdoor Activities': ['Sports Coach', 'Adventure Guide', 'Fitness Buddy', 'Team Player'],
  'Social, Community & News': ['News Analyst', 'Community Leader', 'Social Guide', 'Trend Expert'],
  'Home, DIY & Lifestyle': ['Home Decorator', 'DIY Expert', 'Garden Guide', 'Organization Pro'],
  'Special Interest & Niche Topics': ['Hobby Expert', 'Collector Guide', 'Specialist', 'Enthusiast'],
  'Learning & Education': ['Study Buddy', 'Language Teacher', 'Academic Tutor', 'Research Assistant'],
  'Events & Social Planning': ['Event Planner', 'Party Host', 'Social Coordinator', 'Celebration Expert'],
  'Miscellaneous': ['General Helper', 'Jack of All Trades', 'Custom Assistant', 'Unique Specialist']
};

export function CreateAgentForm({ userId, onBack }: CreateAgentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    personality: '',
    instructions: '',
    prohibition: '',
    imageUrl: '',
    mainCategory: '',
    subCategory: ''
  });
  const [categories, setCategories] = useState<CategoryData>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${api.BASE_URL}/categories`, {
          method: 'GET',
          headers: api.headers
        });
        const data = await response.json();
        
        if (!data.error && data.categories) {
          setCategories(data.categories);
        }
      } catch (err) {
        console.warn('Using default categories:', err);
        // Keep using default categories, no need to show error to user
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const payload = {
      userId: userId, // Using userId directly from props
      agentName: formData.name,
      agentProfileImage: formData.imageUrl || undefined,
      agentMainCategory: formData.mainCategory || undefined,
      agentSubCategory: formData.subCategory || undefined,
      personality: formData.personality || undefined,
      instructions: formData.instructions || undefined,
      prohibition: formData.prohibition || undefined,
      functionTools: []
    };

    try {
      const response = await api.agent.create(payload);
      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // Reset subCategory when mainCategory changes
      if (name === 'mainCategory') {
        return { ...prev, [name]: value, subCategory: '' };
      }
      return { ...prev, [name]: value };
    });
    if (name === 'imageUrl') {
      setImagePreviewError(false);
    }
  };

  return (
    <div className="gradient-card rounded-2xl shadow-fun p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-primary-100 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 text-primary-600" />
          </button>
          <div className="flex items-center space-x-3">
            <Sparkles className="h-7 w-7 text-primary-600 float-animation" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-fun-purple bg-clip-text text-transparent">
              Create Your AI Friend ✨
            </h2>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Category Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mainCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Main Category *
            </label>
            <select
              id="mainCategory"
              name="mainCategory"
              required
              value={formData.mainCategory}
              onChange={handleChange}
              className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300"
            >
              <option value="">Select a category</option>
              {Object.keys(categories).map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Sub Category *
            </label>
            <select
              id="subCategory"
              name="subCategory"
              required
              value={formData.subCategory}
              onChange={handleChange}
              disabled={!formData.mainCategory}
              className="w-full rounded-xl border-2 border-primary-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-300 disabled:opacity-50"
            >
              <option value="">Select a subcategory</option>
              {formData.mainCategory && categories[formData.mainCategory]?.map(subcategory => (
                <option key={subcategory} value={subcategory}>
                  {subcategory}
                </option>
              ))}
            </select>
          </div>
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

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-4 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="text-green-600 text-sm bg-green-50 p-4 rounded-xl">
            Awesome! Your AI friend is ready! ✨
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || success}
            className="btn-fun inline-flex items-center px-8 py-3 rounded-full text-white font-medium text-lg"
          >
            {isLoading ? (
              'Creating...'
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Create AI Friend
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}