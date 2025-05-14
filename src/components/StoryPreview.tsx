'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface StoryPreviewProps {
  originalText: string;
  transformedText: string;
  isLoading: boolean;
  streamingText?: string;
}

export default function StoryPreview({ 
  originalText, 
  transformedText,
  isLoading,
  streamingText = ''
}: StoryPreviewProps) {
  const [activeTab, setActiveTab] = useState<'original' | 'transformed'>('transformed');

  const handleExport = () => {
    const element = document.createElement('a');
    const file = new Blob([transformedText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'transformed-story.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Определим, какой текст показывать
  const displayText = isLoading ? streamingText : transformedText;
  
  // Определим статус текста для отображения пользователю
  const getTextStatus = () => {
    if (isLoading && !streamingText) {
      return 'Ожидание ответа от сервера...';
    } else if (isLoading && streamingText) {
      return 'Получение данных...';
    } else if (!isLoading && !transformedText) {
      return 'Текст не был получен. Пожалуйста, попробуйте еще раз.';
    }
    return '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-4"
    >
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <motion.button
            whileHover={{ backgroundColor: activeTab === 'original' ? undefined : '#f3f4f6' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('original')}
            className={`${
              activeTab === 'original'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            aria-current={activeTab === 'original' ? 'page' : undefined}
            disabled={isLoading}
          >
            Оригинал
          </motion.button>
          <motion.button
            whileHover={{ backgroundColor: activeTab === 'transformed' ? undefined : '#f3f4f6' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('transformed')}
            className={`${
              activeTab === 'transformed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            aria-current={activeTab === 'transformed' ? 'page' : undefined}
          >
            Результат {isLoading && streamingText ? `(${Math.round(streamingText.length/100)/10}K символов)` : ''}
          </motion.button>
        </nav>
      </div>

      <motion.div 
        layout
        className="relative"
      >
        <div className={`overflow-y-auto rounded-md bg-gray-50 p-4 border border-gray-200 prose prose-sm max-w-none h-[400px] ${isLoading && !streamingText ? 'opacity-50' : ''}`}>
          <AnimatePresence mode="wait">
            {isLoading && !streamingText ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-600">Загрузка...</p>
              </motion.div>
            ) : activeTab === 'original' ? (
              <motion.pre 
                key="original"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-pre-wrap"
              >
                {originalText}
              </motion.pre>
            ) : (
              <motion.pre 
                key="transformed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-pre-wrap"
              >
                {displayText || (
                  <div className="text-center text-gray-500 mt-4">
                    {getTextStatus()}
                  </div>
                )}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {transformedText && !isLoading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
            Скачать результат
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
} 