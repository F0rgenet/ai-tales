'use client';

import { useState, useRef } from 'react';
import { DocumentTextIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

interface FileTextInputProps {
  onTextSubmit: (text: string) => void;
}

export default function FileTextInput({ onTextSubmit }: FileTextInputProps) {
  const [text, setText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        setText(text);
      } catch (error) {
        console.error('Ошибка при чтении файла:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      try {
        const text = await files[0].text();
        setText(text);
      } catch (error) {
        console.error('Ошибка при чтении файла:', error);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">Перетащите файл или</p>
            <p className="text-sm text-gray-500">поддерживаются текстовые файлы</p>
          </div>
          <button
            type="button"
            onClick={handleButtonClick}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center space-x-2">
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span>Выбрать файл</span>
            </div>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.doc,.docx,.rtf,.md"
            className="hidden"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
          Или введите текст напрямую:
        </label>
        <textarea
          id="text-input"
          rows={8}
          value={text}
          onChange={handleTextChange}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
          placeholder="Вставьте или введите текст здесь..."
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            text.trim() ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Продолжить
        </button>
      </div>
    </div>
  );
} 