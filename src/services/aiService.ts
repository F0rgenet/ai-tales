

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} from '@google/generative-ai';

import { CharacterReplacement } from '@/components/CharacterReplacementTable';


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


interface TransformStoryParams {
  text: string;
  replacements: CharacterReplacement[];
  additionalContext?: string;
}


interface AISettings {
  apiKey?: string;
}


function initializeAI(settings?: AISettings) {

  const apiKey = process.env.GOOGLE_AI_API_KEY || settings?.apiKey;


  if (!apiKey) {
    console.error('Google AI API key is not provided in server environment variables.');
    throw new Error('Google AI API key is not provided');
  }


  const genAI = new GoogleGenerativeAI(apiKey);


  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-thinking-exp-01-21",
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


export async function transformStory(
  { text, replacements, additionalContext }: TransformStoryParams,
  settings?: AISettings
): Promise<string> {
  const model = initializeAI(settings);


  const prompt = createPrompt(text, replacements, additionalContext);

  try {

    const result = await model.generateContent(prompt);
    const response = result.response;
    const transformedText = response.text();

    return transformedText;
  } catch (error) {
    console.error('Error transforming story in aiService:', error);

    throw new Error('Failed to generate story transformation from AI service');
  }
}


export async function transformStoryStream(
  { text, replacements, additionalContext }: TransformStoryParams,
  settings?: AISettings
): Promise<ReadableStream<Uint8Array>> {
  const model = initializeAI(settings);


  const prompt = createPrompt(text, replacements, additionalContext);

  try {

    const encoder = new TextEncoder();


    return new ReadableStream({
      async start(controller) {
        try {

          const streamingResult = await model.generateContentStream(prompt);


          for await (const chunk of streamingResult.stream) {
            const chunkText = chunk.text();
            if (chunkText) {

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`));
            }
          }


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