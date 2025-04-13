import { Tool } from 'ai'

export interface Variables {
  tools: Record<string, Tool>
}

export enum Providers {
  OpenAiGpt = 'OpenAI GPT',
  AzureOpenAi = 'Azure OpenAI',
  AnthropicClaude = 'Anthropic Claude',
  GoogleGemini = 'Google Gemini',
  XaiGrok = 'xAI Grok',
  DeepSeek = 'DeepSeek',
  Ollama = 'Ollama'
}
