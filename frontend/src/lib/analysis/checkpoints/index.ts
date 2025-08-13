// Checkpoint Registry - 100+ Conversion Optimization Checkpoints

import { Checkpoint, CheckpointCategory } from '../types';
import { conversionOptimizationCheckpoints } from './conversion';
import { psychologyCheckpoints } from './psychology';
import { userExperienceCheckpoints } from './user-experience';
import { performanceCheckpoints } from './performance';
import { accessibilityCheckpoints } from './accessibility';
import { seoCheckpoints } from './seo';
import { mobileCheckpoints } from './mobile';
import { trustSignalsCheckpoints } from './trust-signals';
import { contentCheckpoints } from './content';
import { navigationCheckpoints } from './navigation';

// Master checkpoint registry
export const ALL_CHECKPOINTS: Checkpoint[] = [
  ...conversionOptimizationCheckpoints,
  ...psychologyCheckpoints,
  ...userExperienceCheckpoints,
  ...performanceCheckpoints,
  ...accessibilityCheckpoints,
  ...seoCheckpoints,
  ...mobileCheckpoints,
  ...trustSignalsCheckpoints,
  ...contentCheckpoints,
  ...navigationCheckpoints,
];

// Get checkpoints by category
export function getCheckpointsByCategory(category: CheckpointCategory): Checkpoint[] {
  return ALL_CHECKPOINTS.filter(checkpoint => checkpoint.category === category);
}

// Get checkpoint by ID
export function getCheckpointById(id: string): Checkpoint | undefined {
  return ALL_CHECKPOINTS.find(checkpoint => checkpoint.id === id);
}

// Get all categories
export function getAllCategories(): CheckpointCategory[] {
  const categories = new Set<CheckpointCategory>();
  ALL_CHECKPOINTS.forEach(checkpoint => categories.add(checkpoint.category));
  return Array.from(categories);
}

// Statistics
export const CHECKPOINT_STATS = {
  total: ALL_CHECKPOINTS.length,
  byCategory: Object.fromEntries(
    getAllCategories().map(category => [
      category,
      getCheckpointsByCategory(category).length
    ])
  ),
  highImpact: ALL_CHECKPOINTS.filter(c => c.weight >= 8).length,
  mediumImpact: ALL_CHECKPOINTS.filter(c => c.weight >= 5 && c.weight < 8).length,
  lowImpact: ALL_CHECKPOINTS.filter(c => c.weight < 5).length,
};

console.log(`✅ Loaded ${CHECKPOINT_STATS.total} conversion optimization checkpoints`);
console.log('Categories:', CHECKPOINT_STATS.byCategory);