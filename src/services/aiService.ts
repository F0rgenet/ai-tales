// \'use client\'; // Удаляем эту строку

import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from '@google/generative-ai';

import { CharacterReplacement } from '@/components/CharacterReplacementTable';

// Функция для создания промпта с инструкциями по замене персонажей
function createPrompt(text: string, replacements: CharacterReplacement[], additionalContext?: string): string {
  const replacementText = replacements.length > 0
    ? replacements
        .map(r => `\\"${r.original}\\" на \\"${r.replacement}\\"`)
        .join(', ')
    : 'персонажей по своему усмотрению в соответствии с дополнительным контекстом';

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

// Инициализация API и модели
function initializeAI(settings?: AISettings) {
  // Используем API ключ из переменных окружения сервера
  const apiKey = process.env.GOOGLE_AI_API_KEY || settings?.apiKey;
  
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

  return model;
}

// Функция для трансформации сказки без потока
export async function transformStory(
  { text, replacements, additionalContext }: TransformStoryParams, 
  settings?: AISettings
): Promise<string> {
  const model = initializeAI(settings);
  
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

// Функция для потоковой трансформации сказки
export async function transformStoryStream(
  { text, replacements, additionalContext }: TransformStoryParams,
  settings?: AISettings
): Promise<ReadableStream<Uint8Array>> {
  const model = initializeAI(settings);
  
  // Создаём промпт
  const prompt = createPrompt(text, replacements, additionalContext);

  try {
    // Создаем поток для ответа
    const encoder = new TextEncoder();
    
    // Создаем новый ReadableStream
    return new ReadableStream({
      async start(controller) {
        try {
          // Используем потоковый режим модели
          const streamingResult = await model.generateContentStream(prompt);
          
          // Обрабатываем каждый чанк
          for await (const chunk of streamingResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              // Отправляем данные в поток
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`));
            }
          }
          
          // Завершаем поток
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in streaming response:', error);
          const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: `Ошибка при генерации текста: ${errorMessage}` })}\n\n`)
          );
          controller.close();
        }
      }
    });
  } catch (error) {
    console.error('Error setting up stream in aiService:', error);
    throw new Error('Failed to setup streaming for story transformation');
  }
} 