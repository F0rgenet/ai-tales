// \'use client\'; // Удаляем эту строку

import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from '@google/generative-ai';

import { CharacterReplacement } from '@/components/CharacterReplacementTable';

// Функция для создания промпта с инструкциями по замене персонажей
function createPrompt(text: string, replacements: CharacterReplacement[], additionalContext?: string): string {
  const replacementText = replacements
    .map(r => `\\"${r.original}\\" на \\"${r.replacement}\\"`)
    .join(', ');

  let promptText = `
Текст сказки:
"""
${text}
"""
Пожалуйста, перепиши эту сказку, заменяя следующих персонажей: ${replacementText}.
`;

  if (additionalContext && additionalContext.trim() !== '') {
    promptText += `
Дополнительный контекст для замены:
"""
${additionalContext}
"""
`;
  }

  promptText += `
Важные правила:
1. Сохрани общую структуру и сюжет оригинальной сказки.
2. Замени ТОЛЬКО указанных персонажей, но адаптируй окружающий текст для логичности и связности.
3. Адаптируй грамматику и падежи для новых персонажей, где это необходимо.
4. Если нужно сделать гендерные изменения (он/она), сделай их соответственно.
5. Сохрани стиль оригинального текста.
6. Если переписываешь стихотворные строки - убедись, что везде есть рифма.

Твоя главная задача - тщательно продумать изменившийся контекст сказки и сохранить структуру и последовательность оригинала,
допустимы небольшие отклонения от сюжета для придания персонажам объёма.

Верни ТОЛЬКО переписанный текст без дополнительных комментариев.
`;
  return promptText;
}

// Интерфейс для параметров трансформации сказки
interface TransformStoryParams {
  text: string;
  replacements: CharacterReplacement[];
  additionalContext?: string;
}

// Интерфейс для настроек AI, чтобы в будущем можно было добавить API ключ через settings
interface AISettings {
  apiKey?: string;
}

export async function transformStory({ 
  text, 
  replacements,
  additionalContext
}: TransformStoryParams, 
  settings?: AISettings // settings может быть удален, если ключ всегда берется из process.env
): Promise<string> {
  // Используем API ключ из переменных окружения сервера
  const apiKey = process.env.GOOGLE_AI_API_KEY || settings?.apiKey; // Изменяем здесь
  
  // Проверяем наличие ключа API
  if (!apiKey) {
    console.error('Google AI API key is not provided in server environment variables.');
    throw new Error('Google AI API key is not provided');
  }

  // Инициализируем API
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Получаем модель
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-thinking-exp-01-21", // Убедитесь, что модель актуальна
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
  });

  // Создаём промпт
  const prompt = createPrompt(text, replacements, additionalContext);

  try {
    // Отправляем запрос к модели
    const result = await model.generateContent(prompt);
    const response = result.response;
    const transformedText = response.text();
    
    return transformedText;
  } catch (error) {
    console.error('Error transforming story in aiService:', error);
    // Можно добавить более специфичную обработку ошибок здесь
    throw new Error('Failed to generate story transformation from AI service');
  }
} 