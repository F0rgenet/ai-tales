'use client';

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export interface CharacterReplacement {
  id: string;
  original: string;
  replacement: string;
}

interface CharacterReplacementTableProps {
  replacements: CharacterReplacement[];
  onReplacementsChange: (replacements: CharacterReplacement[]) => void;
  onSubmit: () => void;
  additionalContext: string;
  onAdditionalContextChange: (context: string) => void;
  isLoading?: boolean;
}

export default function CharacterReplacementTable({
  replacements,
  onReplacementsChange,
  onSubmit,
  additionalContext,
  onAdditionalContextChange,
  isLoading
}: CharacterReplacementTableProps) {

  const addReplacement = () => {
    const newReplacement: CharacterReplacement = {
      id: Date.now().toString(),
      original: '',
      replacement: ''
    };
    onReplacementsChange([...replacements, newReplacement]);
  };

  const updateReplacement = (id: string, field: 'original' | 'replacement', value: string) => {
    const updatedReplacements = replacements.map(rep =>
      rep.id === id ? { ...rep, [field]: value } : rep
    );
    onReplacementsChange(updatedReplacements);
  };

  const removeReplacement = (id: string) => {
    const updatedReplacements = replacements.filter(rep => rep.id !== id);
    onReplacementsChange(updatedReplacements);
  };

  const isSubmitDisabled = (
    replacements.length === 0 || replacements.some(rep => !rep.original.trim() || !rep.replacement.trim())
  ) && additionalContext.trim() === '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-3xl mx-auto space-y-6"
    >
      <h2 className="text-xl font-bold text-gray-800">Замена персонажей</h2>
      <p className="text-sm text-gray-600">
        Укажите оригинальных персонажей и их замены или введите дополнительный контекст
      </p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-2"
      >
        <label htmlFor="additional-context" className="block text-sm font-medium text-gray-700">
          Дополнительный контекст
        </label>
        <textarea
          id="additional-context"
          name="additional-context"
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Например: Замени всех персонажей в тексте, кроме тех, кто говорит..."
          value={additionalContext}
          onChange={(e) => onAdditionalContextChange(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Можно ввести только контекст или указать конкретные замены ниже.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="overflow-hidden border border-gray-200 sm:rounded-lg"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Оригинальный персонаж
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Заменить на
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Действия</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {replacements.map((replacement, index) => (
              <motion.tr
                key={replacement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={replacement.original}
                    onChange={(e) => updateReplacement(replacement.id, 'original', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Колобок"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={replacement.replacement}
                    onChange={(e) => updateReplacement(replacement.id, 'replacement', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Пончик"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => removeReplacement(replacement.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
            {replacements.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  Добавьте персонажей для замены или используйте только контекст
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <div className="flex justify-between">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={addReplacement}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
          Добавить персонажа
        </motion.button>

        <motion.button
          whileHover={{ scale: isSubmitDisabled ? 1 : 1.05 }}
          whileTap={{ scale: isSubmitDisabled ? 1 : 0.95 }}
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled || isLoading}
          className={`flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(isSubmitDisabled || isLoading) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Загрузка...
            </>
          ) : (
            'Заменить'
          )}
        </motion.button>
      </div>
    </motion.div>
  );
} 