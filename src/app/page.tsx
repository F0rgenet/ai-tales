'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import FileTextInput from '@/components/FileTextInput';
import CharacterReplacementTable, { CharacterReplacement } from '@/components/CharacterReplacementTable';
import StoryPreview from '@/components/StoryPreview';

enum Step {
  INPUT_TEXT,
  REPLACE_CHARACTERS,
  PREVIEW
}

export default function Home() {
  const [originalText, setOriginalText] = useState<string>('');
  const [transformedText, setTransformedText] = useState<string>('');
  const [streamingText, setStreamingText] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<Step>(Step.INPUT_TEXT);
  const [replacements, setReplacements] = useState<CharacterReplacement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [additionalContext, setAdditionalContext] = useState<string>('');
  
  // Для обработки потоковых данных
  useEffect(() => {
    // Сбрасываем потоковый текст при перезапуске
    if (!isLoading) {
      setStreamingText('');
    }
  }, [isLoading]);

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
      setStreamingText('');
      
      // Используем обычный запрос или потоковый в зависимости от поддержки EventSource
      if (typeof EventSource !== 'undefined') {
        // Используем потоковую обработку
        handleStreamingTransform();
      } else {
        // Для браузеров, не поддерживающих EventSource, используем обычный запрос
        handleRegularTransform();
      }
      
      // Сразу переходим к предпросмотру для отображения процесса
      setCurrentStep(Step.PREVIEW);
    } catch (error) {
      console.error('Error in handleTransform:', error);
      let toastMessage = 'Произошла ошибка при трансформации сказки';
      if (error instanceof Error && error.message) {
        toastMessage = error.message;
      }
      toast.error(toastMessage);
      setIsLoading(false);
    }
  };

  // Функция для обработки потокового ответа
  const handleStreamingTransform = async () => {
    try {
      // Используем fetch для создания запроса к потоковому API
      console.log('Отправка запроса к API потоковой трансформации...');
      const response = await fetch('/api/transform-story-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: originalText, replacements, additionalContext }),
      });

      if (!response.ok) {
        let errorMessage = 'Ошибка при запросе к API';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Не удалось прочитать ответ с ошибкой:', e);
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error('Сервер вернул пустой ответ');
      }

      // Создаем Reader для чтения потока
      const reader = response.body.getReader();
      console.log('Получен поток данных, начинаем чтение...');

      // Функция для чтения и обработки чанков
      const processStream = async () => {
        let accumulatedText = '';
        
        try {
          while (true) {
            console.log('Чтение чанка данных...');
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Поток завершен естественным образом.');
              setIsLoading(false);
              if (accumulatedText) {
                setTransformedText(accumulatedText);
              } else {
                toast.error('Получен пустой результат от сервера.');
              }
              break;
            }
            
            // Декодирование и обработка чанка
            const chunk = new TextDecoder().decode(value);
            console.log('Получен чанк данных:', chunk.slice(0, 50) + '...');
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6); // Убираем 'data: '
                console.log('Обработка данных:', data.slice(0, 50) + '...');
                
                if (data === '[DONE]') {
                  console.log('Получен маркер завершения потока.');
                  setIsLoading(false);
                  if (accumulatedText) {
                    setTransformedText(accumulatedText);
                  } else {
                    toast.error('Получен пустой результат.');
                  }
                  break;
                }
                
                try {
                  const parsedData = JSON.parse(data);
                  
                  if (parsedData.error) {
                    console.error('Получена ошибка в потоке:', parsedData.error);
                    throw new Error(parsedData.error);
                  }
                  
                  if (parsedData.chunk) {
                    console.log('Получен фрагмент текста длиной:', parsedData.chunk.length);
                    // Добавляем к накопленному тексту
                    accumulatedText += parsedData.chunk;
                    setStreamingText(accumulatedText);
                  } else {
                    console.warn('Получены данные без фрагмента текста:', parsedData);
                  }
                } catch (e) {
                  console.error('Failed to parse streaming data:', e);
                  setIsLoading(false);
                  toast.error(`Ошибка при обработке данных: ${e instanceof Error ? e.message : 'Неизвестная ошибка'}`);
                  // Завершаем обработку, если есть ошибка
                  return;
                }
              }
            }
          }
        } catch (error) {
          console.error('Error processing stream:', error);
          setIsLoading(false);
          toast.error(`Ошибка при обработке потока данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
      };
      
      // Запускаем обработку потока
      processStream();
    } catch (error) {
      console.error('Error in handleStreamingTransform:', error);
      setIsLoading(false);
      toast.error(`Ошибка при потоковой обработке: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      // Переходим обратно к шагу с заменами персонажей
      setCurrentStep(Step.REPLACE_CHARACTERS);
    }
  };

  // Функция для обычного запроса (запасной вариант)
  const handleRegularTransform = async () => {
    try {
      console.log('Отправка запроса к стандартному API трансформации...');
      const response = await fetch('/api/transform-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: originalText, replacements, additionalContext }),
      });

      if (!response.ok) {
        let errorMessage = 'Ошибка при запросе к API';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Не удалось прочитать ответ с ошибкой:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.transformedText) {
        throw new Error('Сервер вернул ответ без преобразованного текста');
      }
      
      console.log('Получен ответ с преобразованным текстом длиной:', data.transformedText.length);
      setTransformedText(data.transformedText);
      setIsLoading(false);
      toast.success('Сказка успешно трансформирована!');
    } catch (error) {
      console.error('Error in handleRegularTransform:', error);
      setIsLoading(false);
      toast.error(`Ошибка при обработке: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      // Переходим обратно к шагу с заменами персонажей
      setCurrentStep(Step.REPLACE_CHARACTERS);
    }
  };

  const handleReset = () => {
    setCurrentStep(Step.INPUT_TEXT);
    setOriginalText('');
    setTransformedText('');
    setStreamingText('');
    setReplacements([]);
    setAdditionalContext('');
  };

  const renderStep = () => {
    switch (currentStep) {
      case Step.INPUT_TEXT:
        return (
          <motion.div
            key="input-text"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <FileTextInput onTextSubmit={handleTextSubmit} />
          </motion.div>
        );
      
      case Step.REPLACE_CHARACTERS:
        return (
          <motion.div
            key="replace-characters"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <CharacterReplacementTable
              replacements={replacements}
              onReplacementsChange={setReplacements}
              onSubmit={handleTransform}
              additionalContext={additionalContext}
              onAdditionalContextChange={setAdditionalContext}
              isLoading={isLoading}
            />
            
            <div className="flex justify-between pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Назад
              </motion.button>
            </div>
          </motion.div>
        );
      
      case Step.PREVIEW:
        return (
          <motion.div
            key="preview"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-6"
          >
            <StoryPreview
              originalText={originalText}
              transformedText={transformedText}
              streamingText={streamingText}
              isLoading={isLoading}
            />
            
            <div className="flex justify-between pt-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentStep(Step.REPLACE_CHARACTERS)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                Назад
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                disabled={isLoading}
              >
                Новая сказка
              </motion.button>
            </div>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen flex flex-col">
      <Toaster position="top-right" />
      
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Сказки</h1>
        <p className="text-lg text-gray-600">
          Трансформируйте сказки, заменяя персонажей с помощью искусственного интеллекта
        </p>
      </motion.header>
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </main>
      
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-12 py-6 border-t border-gray-200"
      >
        <div className="text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} AI Сказки
        </div>
      </motion.footer>
    </div>
  );
}
