import { useState } from 'react';
import { useDiaryEntries } from '@/api/diary';
import { today } from '../diary.utils';

export const useDiaryPage = () => {
  const [selectedDate, setSelectedDate] = useState(today());
  const { data: entries, isLoading } = useDiaryEntries(selectedDate);

  const weightEntry = entries?.find(e => e.type === 'WEIGHT');
  const waterEntry = entries?.find(e => e.type === 'WATER');
  const measurementEntry = entries?.find(e => e.type === 'MEASUREMENT');
  const moodEntry = entries?.find(e => e.type === 'MOOD');
  const sleepEntry = entries?.find(e => e.type === 'SLEEP');
  const foodEntry = entries?.find(e => e.type === 'FOOD');
  const workoutEntries = entries?.filter(e => e.type === 'WORKOUT_LOG') ?? [];
  const activityEntries = entries?.filter(e => e.type === 'ACTIVITY') ?? [];
  const stepsEntry = entries?.find(e => e.type === 'STEPS');
  const progressPhotoEntries = entries?.filter(e => e.type === 'PROGRESS_PHOTO') ?? [];

  return {
    selectedDate,
    setSelectedDate,
    entries,
    isLoading,
    weightEntry,
    waterEntry,
    measurementEntry,
    moodEntry,
    sleepEntry,
    foodEntry,
    workoutEntries,
    activityEntries,
    stepsEntry,
    progressPhotoEntries,
  };
};
