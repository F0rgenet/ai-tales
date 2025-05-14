import { NextResponse } from 'next/server';
import { transformStory } from '@/services/aiService';
import type { CharacterReplacement } from '@/components/CharacterReplacementTable';

interface RequestBody {
  text: string;
  replacements: CharacterReplacement[];
  additionalContext?: string;
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { text, replacements, additionalContext } = body;


    if (!text) {
      return NextResponse.json({ error: 'Текст обязателен' }, { status: 400 });
    }


    if (replacements.length === 0 && (!additionalContext || additionalContext.trim() === '')) {
      return NextResponse.json(
        { error: 'Требуется хотя бы одна замена персонажа или дополнительный контекст' },
        { status: 400 }
      );
    }

    const transformedText = await transformStory({
      text,
      replacements,
      additionalContext,
    });

    return NextResponse.json({ transformedText });
  } catch (error) {
    console.error('Error in API route /api/transform-story:', error);
    let errorMessage = 'Failed to transform story.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 