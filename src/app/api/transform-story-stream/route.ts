import { NextRequest } from 'next/server';
import { transformStoryStream } from '@/services/aiService';
import { CharacterReplacement } from '@/components/CharacterReplacementTable';

export async function POST(request: NextRequest) {
  try {
    console.log('Получен запрос на потоковое преобразование');
    
    const { text, replacements, additionalContext } = await request.json() as {
      text: string,
      replacements: CharacterReplacement[],
      additionalContext?: string
    };


    console.log(`Длина текста: ${text.length} символов`);
    console.log(`Количество замен: ${replacements.length}`);
    console.log(`Дополнительный контекст: ${additionalContext ? 'есть' : 'отсутствует'}`);


    if (!text) {
      return Response.json({ error: 'Текст обязателен' }, { status: 400 });
    }


    if (replacements.length === 0 && (!additionalContext || additionalContext.trim() === '')) {
      return Response.json(
        { error: 'Требуется хотя бы одна замена персонажа или дополнительный контекст' },
        { status: 400 }
      );
    }


    console.log('Запускаем потоковое преобразование...');
    const stream = await transformStoryStream({ text, replacements, additionalContext });
    
    console.log('Поток создан, начинаем передачу...');
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in transform-story-stream API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    return Response.json(
      { error: errorMessage || 'Ошибка при обработке запроса' },
      { status: 500 }
    );
  }
} 