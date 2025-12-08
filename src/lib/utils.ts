// Copyright (c) 2025 Jema Technology.
// Distributed under the license specified in the root directory of this project.

import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
