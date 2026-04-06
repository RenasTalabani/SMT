const mongoose = require('mongoose');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
const Course = require('./models/Course');
const Tip = require('./models/Tip');
const WorkoutPlan = require('./models/WorkoutPlan');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gymdb');
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Exercise.deleteMany({});
    await Course.deleteMany({});
    await Tip.deleteMany({});
    await WorkoutPlan.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@gym.com',
      password: "admin123",
      role: 'admin',
      isApproved: true,
      isActive: true,
      phone: '+1234567890',
      dateOfBirth: new Date('1980-01-01'),
      gender: 'male',
      languages: ['en', 'ar', 'ku']
    });
    console.log('Admin user created');

    // Create coach users
    
    const coach1 = await User.create({
      name: 'Ahmed Hassan',
      email: 'ahmed@gym.com',
      password: "coach123",
      role: 'coach',
      isApproved: true,
      isActive: true,
      phone: '+1234567891',
      dateOfBirth: new Date('1985-03-15'),
      gender: 'male',
      specialization: ['strength_training', 'bodybuilding'],
      certifications: [
        { name: 'NSCA-CSCS', issuer: 'NSCA', date: new Date('2020-01-15') },
        { name: 'ACSM-CPT', issuer: 'ACSM', date: new Date('2019-06-20') }
      ],
      bio: 'Professional fitness trainer with 8 years of experience specializing in weight training and bodybuilding.',
      languages: ['en', 'ar']
    });

    
    const coach2 = await User.create({
      name: 'Sara Mohamed',
      email: 'sara@gym.com',
      password: "coach123",
      role: 'coach',
      isApproved: true,
      isActive: true,
      phone: '+1234567892',
      dateOfBirth: new Date('1988-07-20'),
      gender: 'female',
      specialization: ['yoga', 'pilates'],
      certifications: [
        { name: 'RYT-500', issuer: 'Yoga Alliance', date: new Date('2018-03-10') },
        { name: 'Pilates Instructor', issuer: 'Pilates Academy', date: new Date('2019-09-15') }
      ],
      bio: 'Certified yoga and pilates instructor helping clients achieve mind-body wellness.',
      languages: ['en', 'ar']
    });
    console.log('Coach users created');

    // Create client users
    
    const client1 = await User.create({
      name: 'Mohammed Ali',
      email: 'mohammed@gym.com',
      password: "client123",
      role: 'client',
      isApproved: true,
      isActive: true,
      phone: '+1234567893',
      dateOfBirth: new Date('1990-05-10'),
      gender: 'male',
      coach: coach1._id,
      fitnessGoals: ['muscle_gain', 'endurance'],
      fitnessLevel: 'intermediate',
      medicalConditions: [],
      languages: ['ar', 'en']
    });

    
    const client2 = await User.create({
      name: 'Fatima Omar',
      email: 'fatima@gym.com',
      password: "client123",
      role: 'client',
      isApproved: true,
      isActive: true,
      phone: '+1234567894',
      dateOfBirth: new Date('1992-11-25'),
      gender: 'female',
      coach: coach2._id,
      fitnessGoals: ['weight_loss', 'flexibility'],
      fitnessLevel: 'beginner',
      medicalConditions: [],
      languages: ['ar', 'ku']
    });
    console.log('Client users created');

    // Create exercises
    const exercises = await Exercise.insertMany([
      {
        name: 'Push-ups',
        nameAr: 'الضغط على الأرض',
        nameKu: 'Push-up',
        description: 'A bodyweight exercise that targets chest, shoulders, and arms.',
        descriptionAr: 'تمرين وزن الجسم الذي يستهدف الصدر والكتفين والذراعين.',
        category: 'strength',
        muscleGroups: ['chest', 'shoulders', 'arms'],
        equipment: ['none'],
        difficulty: 'beginner',
        instructions: [
          { step: 1, instruction: 'Start in a plank position with hands shoulder-width apart' },
          { step: 2, instruction: 'Lower your body until your chest nearly touches the floor' },
          { step: 3, instruction: 'Push yourself back up to the starting position' }
        ],
        isActive: true,
        createdBy: coach1._id
      },
      {
        name: 'Squats',
        nameAr: 'القرفصاء',
        nameKu: 'Squat',
        description: 'A compound exercise that targets the lower body muscles.',
        descriptionAr: 'تمرين مركب يستهدف عضلات الجزء السفلي من الجسم.',
        category: 'strength',
        muscleGroups: ['legs', 'glutes'],
        equipment: ['none'],
        difficulty: 'beginner',
        instructions: [
          { step: 1, instruction: 'Stand with feet shoulder-width apart' },
          { step: 2, instruction: 'Lower your body as if sitting back into a chair' },
          { step: 3, instruction: 'Keep your chest up and knees behind your toes' },
          { step: 4, instruction: 'Return to standing position' }
        ],
        isActive: true,
        createdBy: coach1._id
      },
      {
        name: 'Plank',
        nameAr: 'اللوح',
        nameKu: 'Plank',
        description: 'An isometric core exercise that builds stability and strength.',
        descriptionAr: 'تمرين عضلات البطن الإيسومتري الذي يبني الاستقرار والقوة.',
        category: 'functional',
        muscleGroups: ['core', 'back'],
        equipment: ['none'],
        difficulty: 'intermediate',
        instructions: [
          { step: 1, instruction: 'Start in a push-up position on your forearms' },
          { step: 2, instruction: 'Keep your body in a straight line from head to heels' },
          { step: 3, instruction: 'Hold the position while breathing normally' },
          { step: 4, instruction: 'Maintain core engagement throughout' }
        ],
        isActive: true,
        createdBy: coach2._id
      },
      {
        name: 'Dumbbell Bicep Curl',
        nameAr: 'تمرين ثني الذراع بالدمبل',
        nameKu: 'Dumbbell Bicep Curl',
        description: 'An isolation exercise targeting the biceps.',
        category: 'strength',
        muscleGroups: ['arms'],
        equipment: ['dumbbells'],
        difficulty: 'beginner',
        instructions: [
          { step: 1, instruction: 'Stand holding a dumbbell in each hand at your sides' },
          { step: 2, instruction: 'Curl the weights up to shoulder height' },
          { step: 3, instruction: 'Slowly lower back to starting position' }
        ],
        isActive: true,
        createdBy: coach1._id
      },
      {
        name: 'Jumping Jacks',
        nameAr: 'القفز المتفرق',
        nameKu: 'Jumping Jacks',
        description: 'A full body cardio exercise that elevates heart rate.',
        category: 'cardio',
        muscleGroups: ['full_body'],
        equipment: ['none'],
        difficulty: 'beginner',
        instructions: [
          { step: 1, instruction: 'Stand upright with feet together and arms at sides' },
          { step: 2, instruction: 'Jump while spreading feet and raising arms overhead' },
          { step: 3, instruction: 'Jump back to starting position' }
        ],
        isActive: true,
        createdBy: coach2._id
      }
    ]);
    console.log('Exercises created');

    // Create workout plans (templates + assigned)
    const workoutPlans = await WorkoutPlan.insertMany([
      {
        title: 'Beginner Full Body',
        titleAr: 'تمرين الجسم الكامل للمبتدئين',
        description: 'A comprehensive full-body workout for beginners. 3 days per week covering all major muscle groups.',
        difficulty: 'beginner',
        category: 'mixed',
        duration: 4,
        frequency: 3,
        goals: ['strength', 'general_fitness'],
        isTemplate: true,
        status: 'active',
        workouts: [
          {
            day: 1,
            name: 'Day 1: Push',
            exercises: [
              { exercise: exercises[0]._id, sets: 3, reps: 12, restTime: 60, order: 0, notes: 'Modify on knees if needed' }
            ]
          },
          {
            day: 2,
            name: 'Day 2: Legs',
            exercises: [
              { exercise: exercises[1]._id, sets: 3, reps: 15, restTime: 60, order: 0, notes: 'Keep back straight' }
            ]
          },
          {
            day: 3,
            name: 'Day 3: Core & Cardio',
            exercises: [
              { exercise: exercises[2]._id, sets: 3, duration: 45, restTime: 30, order: 0 },
              { exercise: exercises[4]._id, sets: 3, reps: 30, restTime: 20, order: 1 }
            ]
          }
        ],
        createdBy: coach1._id
      },
      {
        title: 'Strength Builder',
        titleAr: 'بناء القوة',
        description: 'Intermediate strength training plan focused on compound lifts and progressive overload.',
        difficulty: 'intermediate',
        category: 'strength',
        duration: 8,
        frequency: 4,
        goals: ['strength', 'muscle_gain'],
        isTemplate: true,
        status: 'active',
        workouts: [
          {
            day: 1,
            name: 'Day 1: Upper Strength',
            exercises: [
              { exercise: exercises[0]._id, sets: 4, reps: 10, restTime: 90, order: 0 },
              { exercise: exercises[3]._id, sets: 4, reps: 12, restTime: 60, order: 1 }
            ]
          },
          {
            day: 2,
            name: 'Day 2: Lower Strength',
            exercises: [
              { exercise: exercises[1]._id, sets: 4, reps: 12, restTime: 90, order: 0 }
            ]
          },
          {
            day: 3,
            name: 'Day 3: Core',
            exercises: [
              { exercise: exercises[2]._id, sets: 4, duration: 60, restTime: 30, order: 0 }
            ]
          }
        ],
        createdBy: coach1._id
      },
      {
        title: 'Cardio Blast',
        titleAr: 'كارديو مكثف',
        description: 'High-intensity cardio program to improve endurance and burn fat.',
        difficulty: 'intermediate',
        category: 'cardio',
        duration: 6,
        frequency: 5,
        goals: ['endurance', 'weight_loss'],
        isTemplate: true,
        status: 'active',
        workouts: [
          {
            day: 1,
            name: 'Day 1: Cardio Circuit',
            exercises: [
              { exercise: exercises[4]._id, sets: 5, reps: 40, restTime: 15, order: 0 },
              { exercise: exercises[2]._id, sets: 3, duration: 30, restTime: 20, order: 1 }
            ]
          },
          {
            day: 2,
            name: 'Day 2: HIIT',
            exercises: [
              { exercise: exercises[4]._id, sets: 8, reps: 20, restTime: 10, order: 0 }
            ]
          }
        ],
        createdBy: coach2._id
      },
      {
        title: 'Mohammed — Strength Plan',
        description: 'Personalised strength and muscle gain plan assigned by Coach Ahmed.',
        difficulty: 'intermediate',
        category: 'strength',
        duration: 8,
        frequency: 3,
        goals: ['muscle_gain', 'strength'],
        isTemplate: false,
        status: 'active',
        assignedTo: client1._id,
        workouts: [
          {
            day: 1,
            name: 'Day 1: Push',
            exercises: [
              { exercise: exercises[0]._id, sets: 4, reps: 12, restTime: 60, order: 0 },
              { exercise: exercises[3]._id, sets: 3, reps: 10, restTime: 60, order: 1 }
            ]
          },
          {
            day: 2,
            name: 'Day 2: Legs',
            exercises: [
              { exercise: exercises[1]._id, sets: 4, reps: 15, restTime: 90, order: 0 }
            ]
          },
          {
            day: 3,
            name: 'Day 3: Core',
            exercises: [
              { exercise: exercises[2]._id, sets: 3, duration: 45, restTime: 30, order: 0 }
            ]
          }
        ],
        createdBy: coach1._id
      }
    ]);
    console.log('Workout plans created');

    // Create courses
    const courses = await Course.insertMany([
      {
        title: 'Weight Training Fundamentals',
        titleAr: 'أساسيات تدريب الأثقال',
        description: 'Learn the basics of weight training and proper form. This course covers equipment, safety, and foundational exercises.',
        descriptionAr: 'تعلم أساسيات تدريب الأثقال والشكل الصحيح.',
        category: 'strength_training',
        level: 'beginner',
        duration: 8,
        price: 99.99,
        thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
        instructor: coach1._id,
        content: [
          {
            week: 1,
            title: 'Introduction to Weight Training',
            titleAr: 'مقدمة في تدريب الأثقال',
            description: 'Understanding equipment and safety',
            descriptionAr: 'فهم المعدات والسلامة',
            videoUrl: 'https://example.com/week1-video.mp4',
            materials: [
              { type: 'pdf', title: 'Beginner Guide', url: 'https://example.com/beginner-guide.pdf' }
            ]
          }
        ],
        learningObjectives: [
          'Understand weight training principles',
          'Learn proper exercise form',
          'Create safe workout routines'
        ],
        tags: ['weight training', 'beginner', 'strength'],
        maxStudents: 50,
        isPublished: true,
        isActive: true
      },
      {
        title: 'Yoga for Beginners',
        titleAr: 'اليوغا للمبتدئين',
        description: 'A gentle introduction to yoga focusing on breathing, flexibility, and stress relief.',
        category: 'yoga',
        level: 'beginner',
        duration: 6,
        price: 79.99,
        thumbnail: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
        instructor: coach2._id,
        content: [
          {
            week: 1,
            title: 'Foundations of Yoga',
            description: 'Basic poses and breathing techniques',
            videoUrl: 'https://example.com/yoga-week1.mp4',
            materials: [
              { type: 'pdf', title: 'Yoga Poses Guide', url: 'https://example.com/yoga-guide.pdf' }
            ]
          }
        ],
        learningObjectives: [
          'Learn basic yoga poses',
          'Improve flexibility',
          'Reduce stress through mindful movement'
        ],
        tags: ['yoga', 'beginner', 'flexibility', 'mindfulness'],
        maxStudents: 30,
        isPublished: true,
        isActive: true
      }
    ]);
    console.log('Courses created');

    // Create tips
    const tips = await Tip.insertMany([
      {
        title: 'Stay Hydrated During Workouts',
        titleAr: 'ابق رطباً أثناء التمارين',
        content: 'Proper hydration is crucial for optimal performance and recovery. Drink water before, during, and after your workouts.',
        contentAr: 'الترطيب السليم أمر حاسم للأداء الأمثل والتعافي. اشرب الماء قبل وأثناء وبعد تمارينك.',
        category: 'nutrition',
        type: 'tip',
        difficulty: 'beginner',
        estimatedTime: 5,
        tags: ['hydration', 'nutrition', 'recovery'],
        author: coach1._id,
        isPublished: true,
        isActive: true
      },
      {
        title: 'Importance of Warm-up',
        titleAr: 'أهمية الإحماء',
        content: 'Always warm up before starting your workout to prevent injuries and improve performance.',
        contentAr: 'قم دائماً بالإحماء قبل بدء تمرينك لمنع الإصابات وتحسين الأداء.',
        category: 'training',
        type: 'guide',
        difficulty: 'all_levels',
        estimatedTime: 10,
        tags: ['warm-up', 'safety', 'performance'],
        author: coach2._id,
        isPublished: true,
        isActive: true
      }
    ]);
    console.log('Tips created');

    console.log('Database seeded successfully!');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@gym.com / admin123');
    console.log('Coach 1: ahmed@gym.com / coach123');
    console.log('Coach 2: sara@gym.com / coach123');
    console.log('Client 1: mohammed@gym.com / client123');
    console.log('Client 2: fatima@gym.com / client123');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;