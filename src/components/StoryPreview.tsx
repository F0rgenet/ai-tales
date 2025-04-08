'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface StoryPreviewProps {
  originalText: string;
  transformedText: string;
  isLoading: boolean;
}

export default function StoryPreview({ 
  originalText, 
  transformedText,
  isLoading 
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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('original')}
            className={`${
              activeTab === 'original'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            aria-current={activeTab === 'original' ? 'page' : undefined}
          >
            Оригинал
          </button>
          <button
            onClick={() => setActiveTab('transformed')}
            className={`${
              activeTab === 'transformed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            aria-current={activeTab === 'transformed' ? 'page' : undefined}
          >
            Результат
          </button>
        </nav>
      </div>

      <div className="relative">
        <div className={`overflow-y-auto rounded-md bg-gray-50 p-4 border border-gray-200 prose prose-sm max-w-none h-[400px] ${isLoading ? 'opacity-50' : ''}`}>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'original' ? (
            <pre className="whitespace-pre-wrap">{originalText}</pre>
          ) : (
            <pre className="whitespace-pre-wrap">{transformedText}</pre>
          )}
        </div>
      </div>

      {transformedText && !isLoading && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowDownTrayIcon className="-ml-1 mr-2 h-5 w-5" />
            Скачать результат
          </button>
        </div>
      )}
    </div>
  );
} 