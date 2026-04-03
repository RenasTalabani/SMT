/**
 * Seed script: 7 coaches + 15 exercises + 2 sample workout plans
 * Run: node seed_coaches.js
 * NOTE: Does NOT delete existing users. Safe to run on top of seed_users.js.
 */
const mongoose = require('mongoose');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
const WorkoutPlan = require('./models/WorkoutPlan');
require('dotenv').config();

const SPECIALIZATIONS = [
  'strength_training', 'cardio', 'yoga', 'pilates',
  'crossfit', 'bodybuilding', 'sports_training'
];

const coachData = [
  {
    name: 'Ramyar Kamal',
    email: 'ramyar@gym.com',
    password: 'coach123',
    specialization: ['strength_training', 'bodybuilding'],
    bio: 'Certified strength and conditioning coach with 6 years of experience helping clients build muscle and increase power.',
    hourlyRate: 40,
    gender: 'male',
    rating: 4.8,
    experienceYears: 6,
  },
  {
    name: 'Talar Kozal',
    email: 'talar@gym.com',
    password: 'coach123',
    specialization: ['cardio', 'yoga', 'pilates'],
    bio: 'Certified fitness coach with 5 years of experience. Specialises in cardio conditioning, yoga and mind-body wellness. Passionate about helping clients unlock their full potential.',
    hourlyRate: 35,
    gender: 'female',
    rating: 4.9,
    experienceYears: 5,
  },
  {
    name: 'Bakhan Osman',
    email: 'bakhan@gym.com',
    password: 'coach123',
    specialization: ['strength_training', 'bodybuilding', 'crossfit'],
    bio: 'Strength coach with 7 years of experience in powerlifting and bodybuilding. Helps clients build serious muscle, increase strength, and achieve competition-level physique.',
    hourlyRate: 45,
    gender: 'male',
    rating: 4.8,
    experienceYears: 7,
  },
  {
    name: 'Rebanad Kamaran',
    email: 'rebanad@gym.com',
    password: 'coach123',
    specialization: ['bodybuilding', 'strength_training'],
    bio: 'Competitive bodybuilder and personal trainer specializing in muscle hypertrophy and contest prep.',
    hourlyRate: 45,
    gender: 'male',
    rating: 4.6,
    experienceYears: 5,
  },
  {
    name: 'Ali Baban',
    email: 'ali@gym.com',
    password: 'coach123',
    specialization: ['sports_training', 'cardio'],
    bio: 'Sports performance coach with background in football and athletics. Expert in speed, agility, and endurance.',
    hourlyRate: 42,
    gender: 'male',
    rating: 4.5,
    experienceYears: 4,
  },
  {
    name: 'Harem Dara',
    email: 'harem@gym.com',
    password: 'coach123',
    specialization: ['strength_training', 'crossfit'],
    bio: 'Functional fitness coach specializing in Olympic lifting and kettlebell training.',
    hourlyRate: 36,
    gender: 'male',
    rating: 4.7,
    experienceYears: 5,
  },
  {
    name: 'Renas Dashti',
    email: 'renas@gym.com',
    password: 'coach123',
    specialization: ['strength_training', 'cardio', 'crossfit'],
    bio: 'Head coach with 6 years of elite training experience. Expert in combining strength and cardio for maximum results. Known for high-intensity programmes that deliver real transformation.',
    hourlyRate: 50,
    gender: 'male',
    rating: 4.9,
    experienceYears: 6,
  },
];

const exerciseTemplates = [
  // Strength
  { name: 'Barbell Bench Press', description: 'A fundamental compound chest exercise using a barbell on a bench press rack.', category: 'strength', muscleGroups: ['chest', 'shoulders', 'arms'], equipment: ['barbell', 'bench'], difficulty: 'intermediate', sets: { recommended: 4 }, reps: { recommended: 8 }, restTime: 90, instructions: [ { step: 1, instruction: 'Lie flat on bench, grip barbell slightly wider than shoulder width.' }, { step: 2, instruction: 'Lower bar to mid-chest in a controlled manner.' }, { step: 3, instruction: 'Push bar back up explosively until arms are fully extended.' } ], tips: [{ tip: 'Keep shoulder blades retracted throughout the movement.' }, { tip: 'Feet flat on the floor for stability.' }] },
  { name: 'Barbell Back Squat', description: 'The king of leg exercises. Targets the entire lower body and core.', category: 'strength', muscleGroups: ['legs', 'glutes', 'core'], equipment: ['barbell'], difficulty: 'intermediate', sets: { recommended: 4 }, reps: { recommended: 8 }, restTime: 120, instructions: [ { step: 1, instruction: 'Place barbell on upper traps, feet shoulder-width apart.' }, { step: 2, instruction: 'Squat down until thighs are parallel to the floor.' }, { step: 3, instruction: 'Drive through heels to return to standing.' } ], tips: [{ tip: 'Keep chest up and core braced throughout.' }, { tip: 'Knees track over toes — do not cave inward.' }] },
  { name: 'Deadlift', description: 'A full-body compound exercise that builds overall strength and power.', category: 'strength', muscleGroups: ['back', 'legs', 'glutes', 'core'], equipment: ['barbell'], difficulty: 'intermediate', sets: { recommended: 3 }, reps: { recommended: 5 }, restTime: 180, instructions: [ { step: 1, instruction: 'Stand with bar over mid-foot, grip just outside legs.' }, { step: 2, instruction: 'Hinge at hips, keep back straight, brace core.' }, { step: 3, instruction: 'Drive through the floor to lift bar, lock out hips at top.' }, { step: 4, instruction: 'Lower bar in a controlled reverse movement.' } ], tips: [{ tip: 'Neutral spine is critical — never round your lower back.' }] },
  { name: 'Pull-Ups', description: 'Upper-body pulling exercise that builds lat width and bicep strength.', category: 'strength', muscleGroups: ['back', 'arms'], equipment: ['pull_up_bar'], difficulty: 'intermediate', sets: { recommended: 3 }, reps: { recommended: 10 }, restTime: 90, instructions: [ { step: 1, instruction: 'Grip bar slightly wider than shoulder-width, palms facing away.' }, { step: 2, instruction: 'Hang fully then pull body up until chin clears the bar.' }, { step: 3, instruction: 'Lower slowly back to full hang.' } ], tips: [{ tip: 'Engage lats before pulling — imagine bending the bar.' }] },
  { name: 'Dumbbell Shoulder Press', description: 'Overhead pressing movement for full shoulder development.', category: 'strength', muscleGroups: ['shoulders', 'arms'], equipment: ['dumbbells'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 12 }, restTime: 60, instructions: [ { step: 1, instruction: 'Sit or stand holding dumbbells at shoulder height, palms forward.' }, { step: 2, instruction: 'Press dumbbells overhead until arms are fully extended.' }, { step: 3, instruction: 'Lower back to start with control.' } ], tips: [{ tip: 'Avoid flaring elbows too wide — keep at 45° angle.' }] },
  // Bodyweight
  { name: 'Push-Ups', description: 'Classic bodyweight chest and tricep exercise. No equipment needed.', category: 'strength', muscleGroups: ['chest', 'shoulders', 'arms'], equipment: ['none'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 15 }, restTime: 60, instructions: [ { step: 1, instruction: 'Start in plank position, hands shoulder-width apart.' }, { step: 2, instruction: 'Lower chest to floor keeping body straight.' }, { step: 3, instruction: 'Push back up explosively to start position.' } ], tips: [{ tip: 'Core tight throughout — do not let hips sag.' }] },
  { name: 'Bodyweight Squats', description: 'Fundamental leg movement for beginners and warm-ups.', category: 'strength', muscleGroups: ['legs', 'glutes'], equipment: ['none'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 20 }, restTime: 45, instructions: [ { step: 1, instruction: 'Stand with feet shoulder-width apart, arms forward.' }, { step: 2, instruction: 'Sit back and down as if onto a chair, thighs parallel.' }, { step: 3, instruction: 'Push through heels to stand.' } ], tips: [{ tip: 'Keep weight in heels, chest upright.' }] },
  { name: 'Plank', description: 'Isometric core stabilization exercise. Builds core endurance and posture.', category: 'strength', muscleGroups: ['core'], equipment: ['none'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 1 }, restTime: 60, instructions: [ { step: 1, instruction: 'Forearms on floor, elbows under shoulders.' }, { step: 2, instruction: 'Lift body off floor, form straight line from head to heels.' }, { step: 3, instruction: 'Hold for target duration (30–60 seconds), breathe normally.' } ], tips: [{ tip: 'Do not hold your breath. Keep glutes and core squeezed.' }] },
  // Cardio
  { name: 'Burpees', description: 'Full-body cardio and strength movement. Burns maximum calories in minimum time.', category: 'cardio', muscleGroups: ['full_body'], equipment: ['none'], difficulty: 'intermediate', sets: { recommended: 3 }, reps: { recommended: 10 }, restTime: 60, instructions: [ { step: 1, instruction: 'Stand, then drop hands to floor and jump feet back to plank.' }, { step: 2, instruction: 'Perform a push-up, then jump feet to hands.' }, { step: 3, instruction: 'Explosively jump up with arms overhead.' } ], tips: [{ tip: 'Pace yourself — quality over speed.' }] },
  { name: 'Jump Rope', description: 'Classic cardio exercise for conditioning, coordination, and calorie burn.', category: 'cardio', muscleGroups: ['legs', 'core'], equipment: ['other'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 1 }, restTime: 60, instructions: [ { step: 1, instruction: 'Hold rope handles, rope behind feet.' }, { step: 2, instruction: 'Swing rope overhead and jump as it passes under feet.' }, { step: 3, instruction: 'Land softly on balls of feet, maintain rhythm.' } ], tips: [{ tip: 'Start slow — 30 seconds on / 30 seconds rest for beginners.' }] },
  // Flexibility
  { name: 'Hip Flexor Stretch', description: 'Essential stretch to counteract sitting and improve squat depth.', category: 'flexibility', muscleGroups: ['legs', 'core'], equipment: ['none'], difficulty: 'beginner', sets: { recommended: 2 }, reps: { recommended: 1 }, restTime: 30, instructions: [ { step: 1, instruction: 'Kneel on one knee, other foot forward in a lunge position.' }, { step: 2, instruction: 'Shift weight forward until stretch is felt in front hip.' }, { step: 3, instruction: 'Hold 30 seconds, then switch sides.' } ], tips: [{ tip: 'Keep torso upright and core braced.' }] },
  // Cable exercises
  { name: 'Cable Row', description: 'Horizontal pulling exercise for back thickness and posture.', category: 'strength', muscleGroups: ['back', 'arms'], equipment: ['cable_machine'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 12 }, restTime: 60, instructions: [ { step: 1, instruction: 'Sit at cable row machine, feet on platform, slight knee bend.' }, { step: 2, instruction: 'Pull handle to lower abdomen, elbows close to body.' }, { step: 3, instruction: 'Slowly extend arms back to start.' } ], tips: [{ tip: 'Avoid rounding lower back as you reach forward.' }] },
  { name: 'Lat Pulldown', description: 'Machine-based vertical pull to build lat width — great pull-up alternative.', category: 'strength', muscleGroups: ['back', 'arms'], equipment: ['cable_machine'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 12 }, restTime: 60, instructions: [ { step: 1, instruction: 'Sit at pulldown machine, grip bar wider than shoulder-width.' }, { step: 2, instruction: 'Pull bar down to upper chest, elbows pointing down.' }, { step: 3, instruction: 'Slowly return bar to start position.' } ], tips: [{ tip: 'Lead with elbows, not hands — feel the lats working.' }] },
  { name: 'Kettlebell Swing', description: 'Hip-hinge power exercise for glutes, hamstrings, and cardio conditioning.', category: 'functional', muscleGroups: ['glutes', 'legs', 'core'], equipment: ['kettlebell'], difficulty: 'intermediate', sets: { recommended: 4 }, reps: { recommended: 15 }, restTime: 60, instructions: [ { step: 1, instruction: 'Stand with kettlebell between feet. Hinge at hips, grip bell.' }, { step: 2, instruction: 'Drive hips forward explosively to swing bell to shoulder height.' }, { step: 3, instruction: 'Let bell swing back between legs, hinge at hips to receive.' } ], tips: [{ tip: 'This is a HIP HINGE — not a squat. Power comes from the hips.' }] },
  { name: 'Dumbbell Lunges', description: 'Unilateral leg exercise for balance, strength, and glute development.', category: 'strength', muscleGroups: ['legs', 'glutes'], equipment: ['dumbbells'], difficulty: 'beginner', sets: { recommended: 3 }, reps: { recommended: 12 }, restTime: 60, instructions: [ { step: 1, instruction: 'Stand holding dumbbells at sides.' }, { step: 2, instruction: 'Step forward with one foot, lower back knee toward floor.' }, { step: 3, instruction: 'Push off front foot to return to start. Alternate legs.' } ], tips: [{ tip: 'Front knee should not extend past front toes.' }] },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Remove any existing coaches (except admin from seed_users.js)
  await User.deleteMany({ role: 'coach' });
  console.log('Cleared existing coaches');

  // Create coaches
  const coaches = [];
  for (const data of coachData) {
    const coach = await User.create({
      ...data,
      role: 'coach',
      isApproved: true,
      isActive: true,
      phone: '+964750000000' + coaches.length,
      dateOfBirth: new Date('1988-01-01'),
      experienceYears: data.experienceYears ?? null,
    });
    coaches.push(coach);
    console.log(`  Created coach: ${coach.name}`);
  }

  // Remove existing exercises
  await Exercise.deleteMany({});
  console.log('Cleared existing exercises');

  // Create exercises (all auto-approved)
  const exercises = [];
  for (let i = 0; i < exerciseTemplates.length; i++) {
    const ex = await Exercise.create({
      ...exerciseTemplates[i],
      createdBy: coaches[i % coaches.length]._id,
      isApproved: true,
      isActive: true,
    });
    exercises.push(ex);
  }
  console.log(`  Created ${exercises.length} exercises`);

  // Remove existing workout plans
  await WorkoutPlan.deleteMany({});
  console.log('Cleared existing workout plans');

  // Create 2 sample workout plans (templates)
  const plan1 = await WorkoutPlan.create({
    title: 'Beginner Full Body Program',
    description: '3-day per week full body program perfect for beginners. Builds a foundation of strength using compound movements.',
    createdBy: coaches[0]._id,
    isTemplate: true,
    isPublic: true,
    difficulty: 'beginner',
    category: 'strength',
    duration: 8,
    frequency: 3,
    goals: ['muscle_gain', 'general_fitness'],
    status: 'active',
    workouts: [
      {
        day: 1,
        name: 'Day 1 – Upper Body',
        estimatedDuration: 45,
        exercises: [
          { exercise: exercises[5]._id, sets: 3, reps: 15, restTime: 60, order: 1, notes: 'Warm-up set first' },
          { exercise: exercises[4]._id, sets: 3, reps: 12, restTime: 60, order: 2 },
          { exercise: exercises[3]._id, sets: 3, reps: 8, restTime: 90, order: 3 },
          { exercise: exercises[7]._id, sets: 3, reps: 1, restTime: 60, order: 4, notes: 'Hold 30 seconds' },
        ]
      },
      {
        day: 2,
        name: 'Day 2 – Lower Body',
        estimatedDuration: 50,
        exercises: [
          { exercise: exercises[6]._id, sets: 3, reps: 20, restTime: 45, order: 1, notes: 'Warm-up' },
          { exercise: exercises[1]._id, sets: 4, reps: 8, weight: 60, restTime: 120, order: 2 },
          { exercise: exercises[14]._id, sets: 3, reps: 12, weight: 10, restTime: 60, order: 3 },
          { exercise: exercises[10]._id, sets: 2, reps: 1, restTime: 30, order: 4, notes: 'Hold 30 seconds each side' },
        ]
      },
      {
        day: 3,
        name: 'Day 3 – Full Body',
        estimatedDuration: 55,
        exercises: [
          { exercise: exercises[2]._id, sets: 3, reps: 5, weight: 80, restTime: 180, order: 1 },
          { exercise: exercises[0]._id, sets: 3, reps: 8, weight: 50, restTime: 90, order: 2 },
          { exercise: exercises[13]._id, sets: 4, reps: 15, weight: 16, restTime: 60, order: 3 },
          { exercise: exercises[8]._id, sets: 3, reps: 10, restTime: 60, order: 4 },
        ]
      }
    ]
  });

  const plan2 = await WorkoutPlan.create({
    title: 'Cardio & Core Burn',
    description: '4-day program combining cardio circuits with core work. Great for fat loss and conditioning.',
    createdBy: coaches[2]._id,
    isTemplate: true,
    isPublic: true,
    difficulty: 'intermediate',
    category: 'cardio',
    duration: 6,
    frequency: 4,
    goals: ['weight_loss', 'endurance'],
    status: 'active',
    workouts: [
      {
        day: 1,
        name: 'Day 1 – Cardio Circuit',
        estimatedDuration: 40,
        exercises: [
          { exercise: exercises[9]._id, sets: 3, reps: 1, restTime: 60, order: 1, notes: '3 minutes per set' },
          { exercise: exercises[8]._id, sets: 4, reps: 10, restTime: 60, order: 2 },
          { exercise: exercises[7]._id, sets: 3, reps: 1, restTime: 45, order: 3, notes: 'Hold 45 seconds' },
        ]
      },
      {
        day: 2,
        name: 'Day 2 – Core Focus',
        estimatedDuration: 35,
        exercises: [
          { exercise: exercises[7]._id, sets: 4, reps: 1, restTime: 45, order: 1, notes: 'Hold 60 seconds' },
          { exercise: exercises[6]._id, sets: 3, reps: 15, restTime: 45, order: 2 },
          { exercise: exercises[8]._id, sets: 3, reps: 8, restTime: 60, order: 3 },
        ]
      }
    ]
  });

  console.log(`  Created workout plans: "${plan1.title}", "${plan2.title}"`);

  console.log('\n✓ Seed complete!');
  console.log('\nCoach login credentials:');
  coachData.forEach(c => console.log(`  ${c.name.padEnd(20)} ${c.email.padEnd(25)} / ${c.password}`));

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(e => { console.error(e.message); process.exit(1); });
