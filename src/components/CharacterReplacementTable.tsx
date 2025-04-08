'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export interface CharacterReplacement {
  id: string;
  original: string;
  replacement: string;
}

interface CharacterReplacementTableProps {
  replacements: CharacterReplacement[];
  onReplacementsChange: (replacements: CharacterReplacement[]) => void;
  onSubmit: () => void;
}

export default function CharacterReplacementTable({
  replacements,
  onReplacementsChange,
  onSubmit
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

  const isSubmitDisabled = replacements.length === 0 || 
    replacements.some(rep => !rep.original.trim() || !rep.replacement.trim());

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Замена персонажей</h2>
      <p className="text-sm text-gray-600">
        Укажите оригинальных персонажей и их замены
      </p>
      
      <div className="overflow-hidden border border-gray-200 sm:rounded-lg">
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
            {replacements.map((replacement) => (
              <tr key={replacement.id}>
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
                  <button
                    onClick={() => removeReplacement(replacement.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
            {replacements.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  Добавьте персонажей для замены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={addReplacement}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
          Добавить персонажа
        </button>
        
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isSubmitDisabled ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Заменить
        </button>
      </div>
    </div>
  );
} 