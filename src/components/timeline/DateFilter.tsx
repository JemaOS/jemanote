// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import * as Popover from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { useLanguage } from '@/contexts/LanguageContext';

interface DateFilterProps {
  readonly selectedDate: Date | undefined;
  readonly onSelectDate: (date: Date | undefined) => void;
}

// IconLeft component extracted to avoid nested function declaration
const IconLeftComponent = () => <ChevronLeft className="h-4 w-4" />;

// IconRight component extracted to avoid nested function declaration
const IconRightComponent = () => <ChevronRight className="h-4 w-4" />;

export default function DateFilter({ selectedDate, onSelectDate }: DateFilterProps) {
  const { t, lang } = useLanguage();
  const dateLocale = lang === 'fr' ? fr : enUS;
  // Custom styling for DayPicker to match the app theme
  const css = `
    .rdp {
      --rdp-cell-size: 40px;
      --rdp-accent-color: #3b82f6;
      --rdp-background-color: #eff6ff;
      margin: 0;
    }
    .dark .rdp {
      --rdp-accent-color: #3b82f6;
      --rdp-background-color: #1e3a8a;
      color: #e5e5e5;
    }
    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
      background-color: #f3f4f6;
    }
    .dark .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
      background-color: #262626;
    }
    .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
      background-color: var(--rdp-accent-color);
      color: white;
    }
    .rdp-caption_label {
      font-size: 1rem;
      font-weight: 600;
    }
    .rdp-nav_button {
      width: 32px;
      height: 32px;
    }
  `;

  return (
    <>
      <style>{css}</style>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            className={`flex items-center gap-3 transition-colors rounded-lg p-1 -ml-1 ${
              selectedDate
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'text-primary-500 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={t('filterByDate')}
          >
            <CalendarIcon className="h-8 w-8" />
            {selectedDate && (
              <span className="text-lg font-semibold">
                {format(selectedDate, 'd MMMM yyyy', { locale: dateLocale })}
              </span>
            )}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200"
            sideOffset={8}
            align="start"
          >
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                {t('chooseDate')}
              </h3>
              {selectedDate && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onSelectDate(undefined);
                  }}
                  className="text-xs font-medium text-red-500 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                  {t('clear')}
                </button>
              )}
            </div>

            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={onSelectDate}
              locale={dateLocale}
              showOutsideDays
              fixedWeeks
              components={{
                IconLeft: IconLeftComponent,
                IconRight: IconRightComponent,
              }}
            />
            <Popover.Arrow className="fill-white dark:fill-neutral-900 stroke-neutral-200 dark:stroke-neutral-700" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
