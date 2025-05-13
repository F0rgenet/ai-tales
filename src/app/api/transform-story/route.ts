import { NextResponse } from 'next/server';
import { transformStory } from '@/services/aiService'; // Убедитесь, что путь правильный
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

    if (!text || !replacements) {
      return NextResponse.json({ error: 'Missing required fields: text and replacements' }, { status: 400 });
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