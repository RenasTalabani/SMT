const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@gym.com',
      password: adminPassword,
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
    const coach1Password = await bcrypt.hash('coach123', 12);
    const coach1 = await User.create({
      name: 'Ahmed Hassan',
      email: 'ahmed@gym.com',
      password: coach1Password,
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

    const coach2Password = await bcrypt.hash('coach123', 12);
    const coach2 = await User.create({
      name: 'Sara Mohamed',
      email: 'sara@gym.com',
      password: coach2Password,
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
    const client1Password = await bcrypt.hash('client123', 12);
    const client1 = await User.create({
      name: 'Mohammed Ali',
      email: 'mohammed@gym.com',
      password: client1Password,
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

    const client2Password = await bcrypt.hash('client123', 12);
    const client2 = await User.create({
      name: 'Fatima Omar',
      email: 'fatima@gym.com',
      password: client2Password,
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
        description: 'A bodyweight exercise that targets chest, shoulders, and triceps.',
        descriptionAr: 'تمرين وزن الجسم الذي يستهدف الصدر والكتفين والعضلة الثلاثية الرؤوس.',
        category: 'upper_body',
        muscleGroups: ['chest', 'shoulders', 'triceps'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        instructions: [
          'Start in a plank position with hands shoulder-width apart',
          'Lower your body until your chest nearly touches the floor',
          'Push yourself back up to the starting position'
        ],
        instructionsAr: [
          'ابدأ في وضع اللوح مع يديك بعرض الكتفين',
          'أنزل جسمك حتى يقترب صدرك من الأرض',
          'ادفع نفسك مرة أخرى إلى الوضع الأولي'
        ],
        videoUrl: 'https://example.com/pushup-video.mp4',
        isActive: true,
        createdBy: coach1._id
      },
      {
        name: 'Squats',
        nameAr: 'القرفصاء',
        nameKu: 'Squat',
        description: 'A compound exercise that targets the lower body muscles.',
        descriptionAr: 'تمرين مركب يستهدف عضلات الجزء السفلي من الجسم.',
        category: 'lower_body',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: ['bodyweight'],
        difficulty: 'beginner',
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower your body as if sitting back into a chair',
          'Keep your chest up and knees behind your toes',
          'Return to standing position'
        ],
        instructionsAr: [
          'قف مع قدميك بعرض الكتفين',
          'أنزل جسمك كما لو كنت تجلس على كرسي',
          'حافظ على صدرك مرفوعاً وركبتيك خلف أصابع قدميك',
          'ارجع إلى الوضع الواقف'
        ],
        videoUrl: 'https://example.com/squat-video.mp4',
        isActive: true,
        createdBy: coach1._id
      },
      {
        name: 'Plank',
        nameAr: 'اللوح',
        nameKu: 'Plank',
        description: 'An isometric core exercise that builds stability and strength.',
        descriptionAr: 'تمرين عضلات البطن الإيسومتري الذي يبني الاستقرار والقوة.',
        category: 'core',
        muscleGroups: ['abs', 'obliques', 'lower_back'],
        equipment: ['bodyweight'],
        difficulty: 'intermediate',
        instructions: [
          'Start in a push-up position on your forearms',
          'Keep your body in a straight line from head to heels',
          'Hold the position while breathing normally',
          'Maintain core engagement throughout'
        ],
        instructionsAr: [
          'ابدأ في وضع الضغط على الساعدين',
          'حافظ على جسمك في خط مستقيم من الرأس إلى الكعبين',
          'احتفظ بالوضع مع التنفس بشكل طبيعي',
          'حافظ على شد عضلات البطن طوال الوقت'
        ],
        videoUrl: 'https://example.com/plank-video.mp4',
        isActive: true,
        createdBy: coach2._id
      }
    ]);
    console.log('Exercises created');

    // Create workout plans
    const workoutPlans = await WorkoutPlan.insertMany([
      {
        title: 'Beginner Full Body Workout',
        titleAr: 'تمرين الجسم الكامل للمبتدئين',
        description: 'A comprehensive full-body workout for beginners.',
        descriptionAr: 'تمرين شامل للجسم الكامل مناسب للمبتدئين.',
        level: 'beginner',
        category: 'full_body',
        duration: 45,
        sessionsPerWeek: 3,
        goals: ['Build Strength', 'Improve Fitness'],
        workouts: [
          {
            name: 'Day 1: Upper Body Focus',
            nameAr: 'اليوم 1: التركيز على الجزء العلوي',
            exercises: [
              {
                exercise: exercises[0]._id, // Push-ups
                sets: 3,
                reps: '10-12',
                restTime: 60,
                notes: 'Modify on knees if needed'
              }
            ],
            duration: 30,
            difficulty: 'beginner'
          },
          {
            name: 'Day 2: Lower Body Focus',
            nameAr: 'اليوم 2: التركيز على الجزء السفلي',
            exercises: [
              {
                exercise: exercises[1]._id, // Squats
                sets: 3,
                reps: '12-15',
                restTime: 60,
                notes: 'Keep back straight'
              }
            ],
            duration: 30,
            difficulty: 'beginner'
          }
        ],
        isActive: true,
        isPublished: true,
        createdBy: coach1._id,
        assignedClients: [
          {
            client: client1._id,
            assignedAt: new Date(),
            progress: 25
          }
        ]
      }
    ]);
    console.log('Workout plans created');

    // Create courses
    const courses = await Course.insertMany([
      {
        title: 'Weight Training Fundamentals',
        titleAr: 'أساسيات تدريب الأثقال',
        description: 'Learn the basics of weight training and proper form.',
        descriptionAr: 'تعلم أساسيات تدريب الأثقال والشكل الصحيح.',
        category: 'strength_training',
        level: 'beginner',
        duration: 8,
        sessionsPerWeek: 2,
        price: 99.99,
        instructor: coach1._id,
        content: [
          {
            week: 1,
            title: 'Introduction to Weight Training',
            titleAr: 'مقدمة في تدريب الأثقال',
            description: 'Understanding equipment and safety',
            descriptionAr: 'فهم المعدات والسلامة',
            videoUrl: 'https://example.com/week1-video.mp4',
            materials: ['Beginner Guide PDF']
          }
        ],
        prerequisites: ['Basic fitness level'],
        learningObjectives: [
          'Understand weight training principles',
          'Learn proper exercise form',
          'Create safe workout routines'
        ],
        tags: ['weight training', 'beginner', 'strength'],
        maxStudents: 50,
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
        type: 'advice',
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
        type: 'technique',
        difficulty: 'all',
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