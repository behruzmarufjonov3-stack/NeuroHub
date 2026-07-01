/* ============================================================
   NeuroHub — ai-config.js
   All AI model definitions, branding, and API config
   ============================================================ */

const AI_MODELS = {
  gemini: {
    id:       'gemini',
    name:     'Gemini',
    fullName: 'Gemini 2.0 Flash',
    maker:    'Google',
    initial:  'G',
    tag:      'Fast · Free',
    cssClass: 'gemini',
    endpoint: '/ask',          // routes to Gemini on your server
    model:    'gemini',
  },
  claude: {
    id:       'claude',
    name:     'Claude',
    fullName: 'Claude 3.5 Sonnet',
    maker:    'Anthropic',
    initial:  'C',
    tag:      'Thoughtful · Paid',
    cssClass: 'claude',
    endpoint: '/ask-claude',
    model:    'claude',
  },
  gpt: {
    id:       'gpt',
    name:     'GPT-4o',
    fullName: 'GPT-4o',
    maker:    'OpenAI',
    initial:  'G',
    tag:      'Versatile · Paid',
    cssClass: 'gpt',
    endpoint: '/ask-gpt',
    model:    'gpt',
  },
  llama: {
    id:       'llama',
    name:     'Llama 3',
    fullName: 'Llama 3.3 70B',
    maker:    'Meta · via Groq',
    initial:  'L',
    tag:      'Open · Free',
    cssClass: 'llama',
    endpoint: '/ask-llama',
    model:    'llama',
  },
};

// Build ordered list for UI rendering
const AI_LIST = ['gemini', 'claude', 'gpt', 'llama'].map(id => AI_MODELS[id]);

// Defaults
const DEFAULT_AI1 = 'gemini';
const DEFAULT_AI2 = 'llama';
