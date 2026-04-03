import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import usersReducer from './usersSlice';
import workoutsReducer from './workoutsSlice';
import progressReducer from './progressSlice';
import exercisesReducer from './exercisesSlice';
import notificationsReducer from './notificationsSlice';
import chatReducer from './chatSlice';
import coursesReducer from './coursesSlice';
import tipsReducer from './tipsSlice';
import analyticsReducer from './analyticsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    workouts: workoutsReducer,
    progress: progressReducer,
    exercises: exercisesReducer,
    notifications: notificationsReducer,
    chat: chatReducer,
    courses: coursesReducer,
    tips: tipsReducer,
    analytics: analyticsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
