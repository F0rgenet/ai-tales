'use client';

import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from '@google/generative-ai';

import { CharacterReplacement } from '@/components/CharacterReplacementTable';

// Функция для создания промпта с инструкциями по замене персонажей
function createPrompt(text: string, replacements: CharacterReplacement[]): string {
  const replacementText = replacements
    .map(r => `"${r.original}" на "${r.replacement}"`)
    .join(', ');

  return `
Текст сказки:
"""
${text}
"""

Пожалуйста, перепиши эту сказку, заменяя следующих персонажей: ${replacementText}.

Важные правила:
1. Сохрани общую структуру и сюжет оригинальной сказки.
2. Замени ТОЛЬКО указанных персонажей, но адаптируй окружающий текст для логичности и связности.
3. Адаптируй грамматику и падежи для новых персонажей, где это необходимо.
4. Если нужно сделать гендерные изменения (он/она), сделай их соответственно.
5. Сохрани стиль оригинального текста.

Верни ТОЛЬКО переписанный текст без дополнительных комментариев.
`;
}

// Интерфейс для параметров трансформации сказки
interface TransformStoryParams {
  text: string;
  replacements: CharacterReplacement[];
}

// Интерфейс для настроек AI, чтобы в будущем можно было добавить API ключ через settings
interface AISettings {
  apiKey?: string;
}

export async function transformStory({ 
  text, 
  replacements 
}: TransformStoryParams, 
  settings?: AISettings
): Promise<string> {
  // Используем предустановленный API ключ из .env.local
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || settings?.apiKey;
  
  // Проверяем наличие ключа API
  if (!apiKey) {
    throw new Error('Google AI API key is not provided');
  }

  // Инициализируем API
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Получаем модель
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
  });

  // Создаём промпт
  const prompt = createPrompt(text, replacements);

  try {
    // Отправляем запрос к модели
    const result = await model.generateContent(prompt);
    const response = result.response;
    const transformedText = response.text();
    
    return transformedText;
  } catch (error) {
    console.error('Error transforming story:', error);
    throw error;
  }
} 