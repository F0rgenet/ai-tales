'use client';

import { useState } from 'react';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

import FileTextInput from '@/components/FileTextInput';
import CharacterReplacementTable, { CharacterReplacement } from '@/components/CharacterReplacementTable';
import StoryPreview from '@/components/StoryPreview';
import { transformStory } from '@/services/aiService';

enum Step {
  INPUT_TEXT,
  REPLACE_CHARACTERS,
  PREVIEW
}

export default function Home() {
  const [originalText, setOriginalText] = useState<string>('');
  const [transformedText, setTransformedText] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<Step>(Step.INPUT_TEXT);
  const [replacements, setReplacements] = useState<CharacterReplacement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleTextSubmit = (text: string) => {
    setOriginalText(text);
    setCurrentStep(Step.REPLACE_CHARACTERS);
    // Добавляем пустую строку для замены
    setReplacements([{
      id: Date.now().toString(),
      original: '',
      replacement: ''
    }]);
  };

  const handleTransform = async () => {
    try {
      setIsLoading(true);
      
      const result = await transformStory({ text: originalText, replacements });
      
      setTransformedText(result);
      setCurrentStep(Step.PREVIEW);
      toast.success('Сказка успешно трансформирована!');
    } catch (error) {
      console.error('Error:', error);
      
      toast.error('Произошла ошибка при трансформации сказки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(Step.INPUT_TEXT);
    setOriginalText('');
    setTransformedText('');
    setReplacements([]);
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.INPUT_TEXT:
        return <FileTextInput onTextSubmit={handleTextSubmit} />;
      
      case Step.REPLACE_CHARACTERS:
        return (
          <div className="space-y-6">
            
            <CharacterReplacementTable
              replacements={replacements}
              onReplacementsChange={setReplacements}
              onSubmit={handleTransform}
            />
            
            <div className="flex justify-between pt-4">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Назад
              </button>
            </div>
          </div>
        );
      
      case Step.PREVIEW:
        return (
          <div className="space-y-6">
            <StoryPreview
              originalText={originalText}
              transformedText={transformedText}
              isLoading={isLoading}
            />
            
            <div className="flex justify-between pt-4">
              <button
                onClick={() => setCurrentStep(Step.REPLACE_CHARACTERS)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Назад
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Новая сказка
              </button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <Toaster position="top-right" />
      
      <header className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Сказки</h1>
        <p className="text-lg text-gray-600">
          Трансформируйте сказки, заменяя персонажей с помощью искусственного интеллекта
        </p>
      </header>
      
      <main className="flex-grow">
        {renderStep()}
      </main>
      
      <footer className="mt-12 py-6 border-t border-gray-200">
        <div className="text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} AI Сказки
        </div>
      </footer>
    </div>
  );
}
