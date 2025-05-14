'use client';

import { useState, useRef, useEffect } from 'react';
import { DocumentTextIcon, ArrowUpTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// Определяем поддерживаемые форматы и сопоставления цветов
const SUPPORTED_FORMATS = [
  { ext: 'txt', label: 'TXT', color: 'emerald' },
  { ext: 'pdf', label: 'PDF', color: 'red' },
  { ext: 'docx', label: 'DOCX', color: 'blue' },
  { ext: 'doc', label: 'DOC', color: 'blue' },
  { ext: 'rtf', label: 'RTF', color: 'purple' },
  { ext: 'md', label: 'MD', color: 'gray' },
];

// Функция для получения классов цвета для формата
const getColorClasses = (color: string): { bg: string; text: string } => {
  const colors: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    red: { bg: 'bg-red-100', text: 'text-red-800' },
    blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-800' },
  };
  
  return colors[color] || { bg: 'bg-gray-100', text: 'text-gray-800' };
};

interface FileTextInputProps {
  onTextSubmit: (text: string) => void;
}

export default function FileTextInput({ onTextSubmit }: FileTextInputProps) {
  const [text, setText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<{name: string, format: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Для корректной работы с pdfjs в Next.js
  useEffect(() => {
    const setupPdfjs = async () => {
      // Это загружает библиотеку только на стороне клиента
      if (typeof window !== 'undefined') {
        try {
          const pdfjsLib = await import('pdfjs-dist');
          
          // Используем локальную версию worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';
            
          console.log('PDF.js инициализирован с локальным worker');
        } catch (error) {
          console.warn('Ошибка при инициализации PDF.js:', error);
        }
      }
    };
    
    setupPdfjs();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setErrorMessage('');
    // Если пользователь вручную изменил текст, сбросим информацию о файле
    if (currentFile) {
      setCurrentFile(null);
    }
  };

  const handleSubmit = () => {
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  const extractTextFromPdf = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      
      // При необходимости проверяем, настроен ли worker
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';
      }
      
      // Используем встроенный обработчик PDF вместо worker для большей надежности
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer, 
        disableStream: true, 
        disableAutoFetch: true,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      
      let extractedText = '';
      
      // Извлекаем текст из каждой страницы
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
          
        extractedText += pageText + '\n';
      }
      
      return extractedText;
    } catch (error) {
      console.error('Ошибка при чтении PDF:', error);
      throw new Error(`Ошибка при чтении PDF: ${(error as Error).message}`);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      // Обновим информацию о текущем файле
      setCurrentFile({
        name: file.name,
        format: extension.toUpperCase()
      });
      
      switch (extension) {
        case 'pdf':
          const arrayBuffer = await file.arrayBuffer();
          return await extractTextFromPdf(arrayBuffer);
          
        case 'docx':
          const mammoth = await import('mammoth');
          const docxArrayBuffer = await file.arrayBuffer();
          const docxResult = await mammoth.extractRawText({ arrayBuffer: docxArrayBuffer });
          return docxResult.value;
          
        case 'txt':
        case 'md':
        case 'rtf':
        default:
          return await file.text();
      }
    } catch (error) {
      console.error('Ошибка при чтении файла:', error);
      setErrorMessage(`Ошибка при чтении файла: ${(error as Error).message || 'Неизвестная ошибка'}`);
      setCurrentFile(null);
      return '';
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extractedText = await extractTextFromFile(file);
      if (extractedText) {
        setText(extractedText);
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
      const extractedText = await extractTextFromFile(files[0]);
      if (extractedText) {
        setText(extractedText);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Создаем строку принимаемых форматов
  const acceptFormats = SUPPORTED_FORMATS.map(format => `.${format.ext}`).join(',');

  // Находим цвет для формата текущего файла
  const getCurrentFormatColor = () => {
    if (!currentFile) return null;
    const format = SUPPORTED_FORMATS.find(f => f.ext.toUpperCase() === currentFile.format);
    return format ? format.color : 'gray';
  };

  const currentFormatColor = getCurrentFormatColor();
  const currentColorClasses = currentFormatColor ? getColorClasses(currentFormatColor) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-4"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <motion.div 
            animate={{ 
              rotate: isDragging ? [0, -10, 10, -10, 0] : 0 
            }}
            transition={{ duration: 0.5 }}
            className="p-3 bg-blue-100 rounded-full"
          >
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
          </motion.div>
          <div className="text-center">
            <p className="text-lg font-medium">Перетащите файл или</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {SUPPORTED_FORMATS.map((format, index) => {
                const colorClasses = getColorClasses(format.color);
                return (
                  <motion.span 
                    key={format.ext}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                    className={`text-xs font-medium px-2 py-1 rounded-md ${colorClasses.bg} ${colorClasses.text}`}
                  >
                    {format.label}
                  </motion.span>
                );
              })}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleButtonClick}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <ArrowUpTrayIcon className="w-5 h-5" />
              )}
              <span>{isLoading ? 'Обработка...' : 'Выбрать файл'}</span>
            </div>
          </motion.button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept={acceptFormats}
            className="hidden"
            disabled={isLoading}
          />

          {currentFile && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center mt-2 p-2 rounded-md bg-gray-50"
            >
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
              <span className="text-sm text-gray-700 mr-1">
                {currentFile.name}
              </span>
              {currentColorClasses && (
                <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-md ${currentColorClasses.bg} ${currentColorClasses.text}`}>
                  {currentFile.format}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-3 bg-red-100 text-red-700 rounded-md"
        >
          {errorMessage}
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-2"
      >
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
          disabled={isLoading}
        />
      </motion.div>

      <div className="flex justify-end">
        <motion.button
          whileHover={{ scale: text.trim() && !isLoading ? 1.05 : 1 }}
          whileTap={{ scale: text.trim() && !isLoading ? 0.95 : 1 }}
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            text.trim() && !isLoading ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Продолжить
        </motion.button>
      </div>
    </motion.div>
  );
}