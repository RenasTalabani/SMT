const mongoose = require('mongoose');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
const Course = require('./models/Course');
const Tip = require('./models/Tip');
const WorkoutPlan = require('./models/WorkoutPlan');
const BodyPart = require('./src/models/BodyPart');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, `.env.${process.env.NODE_ENV || 'development'}`) });

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
    await BodyPart.deleteMany({});
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
      avatar: '/sample/coaches/ahmed.svg',
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
      bio: '[SAMPLE] Professional fitness trainer with 8 years of experience specializing in weight training and bodybuilding.',
      languages: ['en', 'ar']
    });

    
    const coach2 = await User.create({
      name: 'Sara Mohamed',
      avatar: '/sample/coaches/sara.svg',
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
      bio: '[SAMPLE] Certified yoga and pilates instructor helping clients achieve mind-body wellness.',
      languages: ['en', 'ar']
    });

    const coach3 = await User.create({
      name: 'Karwan Aziz',
      avatar: '/sample/coaches/karwan.svg',
      email: 'karwan@gym.com',
      password: "coach123",
      role: 'coach',
      isApproved: true,
      isActive: true,
      phone: '+9647500000003',
      dateOfBirth: new Date('1990-02-11'),
      gender: 'male',
      specialization: ['crossfit', 'cardio'],
      certifications: [{ name: 'CrossFit Level 2', issuer: 'CrossFit', date: new Date('2021-04-01') }],
      bio: '[SAMPLE] HIIT and fat-loss coach. Speaks Kurdish, Arabic and English.',
      languages: ['ku', 'ar', 'en']
    });

    const coach4 = await User.create({
      name: 'Lana Rashid',
      avatar: '/sample/coaches/lana.svg',
      email: 'lana@gym.com',
      password: "coach123",
      role: 'coach',
      isApproved: true,
      isActive: true,
      phone: '+9647500000004',
      dateOfBirth: new Date('1994-09-02'),
      gender: 'female',
      specialization: ['pilates', 'cardio'],
      certifications: [{ name: 'Precision Nutrition L1', issuer: 'Precision Nutrition', date: new Date('2022-01-20') }],
      bio: '[SAMPLE] Nutrition and women-only training coach.',
      languages: ['ku', 'en']
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
        isApproved: true,
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
        isApproved: true,
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
        isApproved: true,
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
        isApproved: true,
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
        isApproved: true,
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
        isPublic: true,
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
        isPublic: true,
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
        isPublic: true,
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
        price: 75000,
        currency: 'IQD',
        thumbnail: '/sample/courses/weight-training.svg',
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
        price: 60000,
        currency: 'IQD',
        thumbnail: '/sample/courses/yoga.svg',
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

    // ─── Anatomy seed data ─────────────────────────────────────────────────────
    await BodyPart.insertMany([
      // ── MUSCLES – Upper Body ────────────────────────────────────────────────
      {
        partId: 'pectoralis_major', name: 'Pectoralis Major', nameAr: 'العضلة الصدرية الكبرى', nameKu: 'ماسولکەی گەورەی سنگ',
        type: 'muscle', region: 'upper_body', side: 'both',
        description: 'The large fan-shaped muscle that covers most of the chest.',
        function: 'Flexion, adduction, and internal rotation of the arm. Primary pushing muscle.',
        origin: 'Clavicle, sternum, and costal cartilages', insertion: 'Intertubercular groove of humerus',
        innervation: 'Medial and lateral pectoral nerves (C5–T1)',
        relatedExercises: ['Bench Press', 'Push-ups', 'Cable Fly', 'Dips', 'Chest Press'],
        antagonistMuscles: ['Trapezius', 'Rhomboids', 'Rear Deltoid'],
        synergistMuscles: ['Anterior Deltoid', 'Triceps', 'Serratus Anterior'],
        injuryRisks: ['Pectoral tear', 'Sternoclavicular joint sprain', 'Muscle strain'],
        recoveryTips: ['Rest 48–72 hours between chest workouts', 'Ice for acute injury', 'Gradual return to pressing movements'],
        warmUpTips: ['Band pull-aparts', 'Shoulder circles', 'Light dumbbell fly'],
        isActive: true,
      },
      {
        partId: 'biceps_brachii', name: 'Biceps Brachii', nameAr: 'العضلة ذات الرأسين', nameKu: 'ماسولکەی دوو سەری باسک',
        type: 'muscle', region: 'upper_body', side: 'both',
        description: 'A two-headed muscle located on the front of the upper arm.',
        function: 'Flexion and supination of the forearm. Assists in shoulder flexion.',
        origin: 'Coracoid process (short head), supraglenoid tubercle (long head)', insertion: 'Radial tuberosity',
        innervation: 'Musculocutaneous nerve (C5–C6)',
        relatedExercises: ['Bicep Curl', 'Hammer Curl', 'Pull-up', 'Chin-up', 'Cable Curl'],
        antagonistMuscles: ['Triceps Brachii'],
        synergistMuscles: ['Brachialis', 'Brachioradialis'],
        injuryRisks: ['Distal bicep tendon rupture', 'Bicep tendinitis', 'Muscle strain'],
        recoveryTips: ['Avoid heavy supinated curls while healing', 'Eccentric training for tendinitis', 'Ice and rest'],
        warmUpTips: ['Light band curls', 'Arm swings', 'Wrist rotations'],
        isActive: true,
      },
      {
        partId: 'triceps_brachii', name: 'Triceps Brachii', nameAr: 'العضلة ثلاثية الرؤوس', nameKu: 'ماسولکەی سێ سەری باسک',
        type: 'muscle', region: 'upper_body', side: 'both',
        description: 'A three-headed muscle on the back of the upper arm.',
        function: 'Extension of the forearm at the elbow. Primary pushing muscle.',
        origin: 'Infraglenoid tubercle (long), posterior humerus (medial/lateral)', insertion: 'Olecranon of ulna',
        innervation: 'Radial nerve (C6–C8)',
        relatedExercises: ['Tricep Pushdown', 'Close-grip Bench Press', 'Skull Crushers', 'Dips', 'Overhead Extension'],
        antagonistMuscles: ['Biceps Brachii', 'Brachialis'],
        synergistMuscles: ['Anconeus', 'Pectoralis Major'],
        injuryRisks: ['Tricep tendon tear', 'Lateral epicondylitis', 'Muscle strain'],
        recoveryTips: ['Avoid full extension under load', 'Foam rolling', 'Eccentric loading'],
        warmUpTips: ['Arm circles', 'Resistance band pushdowns', 'Light overhead stretch'],
        isActive: true,
      },
      {
        partId: 'deltoid', name: 'Deltoid', nameAr: 'العضلة الدالية', nameKu: 'ماسولکەی شان',
        type: 'muscle', region: 'upper_body', side: 'both',
        description: 'The triangular muscle forming the rounded contour of the shoulder.',
        function: 'Abduction, flexion, and extension of the arm at the shoulder.',
        origin: 'Clavicle (anterior), acromion (middle), spine of scapula (posterior)', insertion: 'Deltoid tuberosity of humerus',
        innervation: 'Axillary nerve (C5–C6)',
        relatedExercises: ['Shoulder Press', 'Lateral Raise', 'Front Raise', 'Reverse Fly', 'Upright Row'],
        antagonistMuscles: ['Latissimus Dorsi', 'Pectoralis Major'],
        synergistMuscles: ['Supraspinatus', 'Serratus Anterior', 'Trapezius'],
        injuryRisks: ['Rotator cuff impingement', 'Shoulder bursitis', 'AC joint injury'],
        recoveryTips: ['Rotator cuff strengthening', 'Avoid overhead pressing with pain', 'Physical therapy'],
        warmUpTips: ['Pendulum swings', 'Band pull-aparts', 'External rotation drills'],
        isActive: true,
      },
      {
        partId: 'latissimus_dorsi', name: 'Latissimus Dorsi', nameAr: 'العضلة الظهرية العريضة', nameKu: 'ماسولکەی پانی پشت',
        type: 'muscle', region: 'upper_body', side: 'both',
        description: 'The broadest muscle of the back, forming the V-shape.',
        function: 'Extension, adduction, and internal rotation of the arm. Pulls the arm downward and backward.',
        origin: 'Spinous processes T7–L5, iliac crest, lower ribs', insertion: 'Intertubercular groove of humerus',
        innervation: 'Thoracodorsal nerve (C6–C8)',
        relatedExercises: ['Pull-up', 'Lat Pulldown', 'Bent-over Row', 'Seated Cable Row', 'T-bar Row'],
        antagonistMuscles: ['Anterior Deltoid', 'Pectoralis Major'],
        synergistMuscles: ['Teres Major', 'Rhomboids', 'Biceps Brachii'],
        injuryRisks: ['Lat strain', 'Teres major tear', 'Lower back strain'],
        recoveryTips: ['Lat stretching against a doorframe', 'Foam rolling thoracic spine', 'Light rows'],
        warmUpTips: ['Band-assisted pull-aparts', 'Hanging from a bar', 'Thoracic rotations'],
        isActive: true,
      },
      {
        partId: 'trapezius', name: 'Trapezius', nameAr: 'العضلة الشبه منحرفة', nameKu: 'ماسولکەی تراپیزیۆس (پشتی مل)',
        type: 'muscle', region: 'upper_body', side: 'both',
        description: 'A large trapezoid-shaped muscle spanning the neck, shoulders, and back.',
        function: 'Elevation, retraction, and depression of the scapula. Head and neck extension.',
        origin: 'Occipital bone, ligamentum nuchae, spinous processes C7–T12', insertion: 'Clavicle, acromion, spine of scapula',
        innervation: 'Accessory nerve (CN XI), C3–C4',
        relatedExercises: ['Shrugs', 'Upright Row', 'Face Pull', 'Deadlift', 'Farmers Carry'],
        antagonistMuscles: ['Serratus Anterior', 'Pectoralis Minor'],
        synergistMuscles: ['Rhomboids', 'Levator Scapulae'],
        injuryRisks: ['Trapezius strain', 'Neck stiffness', 'Thoracic outlet syndrome'],
        recoveryTips: ['Neck stretches', 'Massage therapy', 'Posture correction exercises'],
        warmUpTips: ['Neck rolls', 'Shoulder shrugs', 'Upper trap stretches'],
        isActive: true,
      },
      // ── MUSCLES – Core ──────────────────────────────────────────────────────
      {
        partId: 'rectus_abdominis', name: 'Rectus Abdominis', nameAr: 'عضلة البطن المستقيمة', nameKu: 'ماسولکەی ڕاستی سک',
        type: 'muscle', region: 'core', side: 'center',
        description: 'The "six-pack" muscle running vertically along the front of the abdomen.',
        function: 'Flexion of the lumbar spine. Compression of the abdominal cavity.',
        origin: 'Pubic symphysis and pubic crest', insertion: 'Xiphoid process and costal cartilages 5–7',
        innervation: 'Thoracoabdominal nerves (T7–T12)',
        relatedExercises: ['Crunches', 'Sit-ups', 'Leg Raises', 'Cable Crunch', 'Ab Rollout'],
        antagonistMuscles: ['Erector Spinae'],
        synergistMuscles: ['External Oblique', 'Internal Oblique', 'Transverse Abdominis'],
        injuryRisks: ['Abdominal strain', 'Diastasis recti', 'Hernia'],
        recoveryTips: ['Avoid heavy flexion if strained', 'Core bracing exercises', 'Gradual loading'],
        warmUpTips: ['Cat-cow stretches', 'Dead bugs', 'Hollow body holds'],
        isActive: true,
      },
      {
        partId: 'obliques', name: 'Obliques', nameAr: 'عضلات البطن المائلة', nameKu: 'ماسولکە لارەکانی سک',
        type: 'muscle', region: 'core', side: 'both',
        description: 'External and internal obliques forming the sides of the abdominal wall.',
        function: 'Rotation and lateral flexion of the trunk. Compresses abdominal contents.',
        origin: 'Ribs 5–12 (external), thoracolumbar fascia (internal)', insertion: 'Iliac crest, linea alba',
        innervation: 'Thoracoabdominal nerves (T7–L1)',
        relatedExercises: ['Russian Twist', 'Side Plank', 'Woodchopper', 'Oblique Crunch', 'Pallof Press'],
        antagonistMuscles: ['Opposite Oblique'],
        synergistMuscles: ['Rectus Abdominis', 'Transverse Abdominis'],
        injuryRisks: ['Oblique strain', 'Side stitch', 'Sports hernia'],
        recoveryTips: ['Lateral stretches', 'Avoid rotation under load', 'Gradual return to sport'],
        warmUpTips: ['Trunk rotations', 'Side bends', 'Standing oblique crunches'],
        isActive: true,
      },
      {
        partId: 'erector_spinae', name: 'Erector Spinae', nameAr: 'عضلات القامة', nameKu: 'ماسولکەکانی ڕاگری بڕبڕە',
        type: 'muscle', region: 'core', side: 'both',
        description: 'A group of muscles running along the length of the spine.',
        function: 'Extension and lateral flexion of the spine. Maintains upright posture.',
        origin: 'Sacrum, iliac crest, spinous processes', insertion: 'Ribs, transverse processes, occipital bone',
        innervation: 'Posterior rami of spinal nerves',
        relatedExercises: ['Deadlift', 'Back Extension', 'Good Morning', 'Romanian Deadlift', 'Superman'],
        antagonistMuscles: ['Rectus Abdominis'],
        synergistMuscles: ['Multifidus', 'Quadratus Lumborum', 'Glutes'],
        injuryRisks: ['Lower back strain', 'Disc herniation', 'Facet joint irritation'],
        recoveryTips: ['McKenzie exercises', 'Core stability training', 'Hip flexor stretches'],
        warmUpTips: ['Cat-cow', 'Bird-dog', 'Hip hinges with light weight'],
        isActive: true,
      },
      // ── MUSCLES – Lower Body ────────────────────────────────────────────────
      {
        partId: 'quadriceps', name: 'Quadriceps', nameAr: 'عضلة الفخذ الرباعية الرؤوس', nameKu: 'ماسولکەی چوار سەری ڕان',
        type: 'muscle', region: 'lower_body', side: 'both',
        description: 'A group of four muscles on the front of the thigh.',
        function: 'Extension of the knee. Rectus femoris also flexes the hip.',
        origin: 'Anterior inferior iliac spine (rectus femoris), femur (vastus group)', insertion: 'Tibial tuberosity via patellar tendon',
        innervation: 'Femoral nerve (L2–L4)',
        relatedExercises: ['Squat', 'Leg Press', 'Leg Extension', 'Lunges', 'Step-ups'],
        antagonistMuscles: ['Hamstrings'],
        synergistMuscles: ['Glutes', 'Hip Flexors'],
        injuryRisks: ['Patellar tendinitis', 'Quad strain', 'Knee ligament injuries'],
        recoveryTips: ['Ice after intense workouts', 'Foam rolling', 'Eccentric quad exercises'],
        warmUpTips: ['Leg swings', 'Walking lunges', 'Bodyweight squats'],
        isActive: true,
      },
      {
        partId: 'hamstrings', name: 'Hamstrings', nameAr: 'عضلات الفخذ الخلفية', nameKu: 'ماسولکەکانی پشتی ڕان',
        type: 'muscle', region: 'lower_body', side: 'both',
        description: 'Three muscles on the back of the thigh: biceps femoris, semitendinosus, semimembranosus.',
        function: 'Flexion of the knee and extension of the hip.',
        origin: 'Ischial tuberosity', insertion: 'Tibia and fibula head',
        innervation: 'Sciatic nerve (L4–S3)',
        relatedExercises: ['Romanian Deadlift', 'Leg Curl', 'Good Morning', 'Glute-Ham Raise', 'Nordic Curl'],
        antagonistMuscles: ['Quadriceps'],
        synergistMuscles: ['Glutes', 'Adductors'],
        injuryRisks: ['Hamstring strain (most common sports injury)', 'Proximal hamstring tendinopathy'],
        recoveryTips: ['Nordic hamstring curls for prevention', 'Eccentric loading', 'Avoid sprinting when tight'],
        warmUpTips: ['Leg swings', 'Hip hinges', 'Dynamic hamstring stretches'],
        isActive: true,
      },
      {
        partId: 'gluteus_maximus', name: 'Gluteus Maximus', nameAr: 'العضلة الألوية الكبرى', nameKu: 'ماسولکەی گەورەی سمت',
        type: 'muscle', region: 'lower_body', side: 'both',
        description: 'The largest and most superficial of the gluteal muscles.',
        function: 'Extension and external rotation of the hip. Critical for running and jumping.',
        origin: 'Posterior ilium, sacrum, coccyx', insertion: 'Iliotibial tract and gluteal tuberosity',
        innervation: 'Inferior gluteal nerve (L5–S2)',
        relatedExercises: ['Squat', 'Deadlift', 'Hip Thrust', 'Glute Bridge', 'Cable Kickback'],
        antagonistMuscles: ['Iliopsoas', 'Rectus Femoris'],
        synergistMuscles: ['Hamstrings', 'Erector Spinae'],
        injuryRisks: ['Gluteal tendinopathy', 'Piriformis syndrome', 'SI joint pain'],
        recoveryTips: ['Glute activation exercises', 'Piriformis stretches', 'Hip mobility work'],
        warmUpTips: ['Glute bridges', 'Clamshells', 'Monster walks with band'],
        isActive: true,
      },
      {
        partId: 'gastrocnemius', name: 'Gastrocnemius', nameAr: 'عضلة الساق', nameKu: 'ماسولکەی پشتی لاق',
        type: 'muscle', region: 'lower_body', side: 'both',
        description: 'The two-headed calf muscle forming the rounded contour of the lower leg.',
        function: 'Plantarflexion of the foot. Assists in knee flexion.',
        origin: 'Medial and lateral femoral condyles', insertion: 'Calcaneus via Achilles tendon',
        innervation: 'Tibial nerve (S1–S2)',
        relatedExercises: ['Standing Calf Raise', 'Donkey Calf Raise', 'Jump Rope', 'Box Jumps'],
        antagonistMuscles: ['Tibialis Anterior'],
        synergistMuscles: ['Soleus', 'Flexor Hallucis Longus'],
        injuryRisks: ['Achilles tendinitis', 'Calf strain', 'Deep vein thrombosis'],
        recoveryTips: ['Eccentric calf raises for tendinitis', 'Heel drops', 'Massage'],
        warmUpTips: ['Ankle circles', 'Calf stretches', 'Light calf raises'],
        isActive: true,
      },
      // ── JOINTS ──────────────────────────────────────────────────────────────
      {
        partId: 'shoulder_joint', name: 'Shoulder Joint (Glenohumeral)', nameAr: 'مفصل الكتف', nameKu: 'جومگەی شان',
        type: 'joint', region: 'upper_body', side: 'both',
        description: 'A ball-and-socket joint providing the greatest range of motion of any joint in the body.',
        function: 'Allows arm movement in multiple planes: flexion, extension, abduction, adduction, rotation.',
        relatedExercises: ['Shoulder Press', 'Lateral Raise', 'Pull-up', 'Push-up', 'Bench Press'],
        injuryRisks: ['Rotator cuff tear', 'SLAP tear', 'Shoulder dislocation', 'AC joint separation', 'Bursitis'],
        recoveryTips: ['Rotator cuff strengthening', 'Scapular stabilization', 'Avoid overhead pressing with pain'],
        warmUpTips: ['Shoulder circles', 'Band external rotations', 'Wall slides'],
        isActive: true,
      },
      {
        partId: 'knee_joint', name: 'Knee Joint', nameAr: 'مفصل الركبة', nameKu: 'جومگەی ئەژنۆ',
        type: 'joint', region: 'lower_body', side: 'both',
        description: 'A hinge joint connecting the femur and tibia, stabilized by multiple ligaments.',
        function: 'Flexion and extension of the lower leg. Slight rotation in flexion.',
        relatedExercises: ['Squat', 'Leg Press', 'Leg Extension', 'Leg Curl', 'Lunges'],
        injuryRisks: ['ACL tear', 'MCL sprain', 'Meniscus tear', 'Patellar tendinitis', 'Runner\'s knee'],
        recoveryTips: ['Quad/hamstring balance', 'Hip strengthening', 'Proper landing mechanics'],
        warmUpTips: ['Leg swings', 'Knee circles', 'Bodyweight squats'],
        isActive: true,
      },
      {
        partId: 'hip_joint', name: 'Hip Joint', nameAr: 'مفصل الورك', nameKu: 'جومگەی حەوز (ڕان)',
        type: 'joint', region: 'lower_body', side: 'both',
        description: 'A ball-and-socket joint connecting the femur to the pelvis.',
        function: 'Supports body weight, flexion, extension, abduction, adduction, and rotation of the thigh.',
        relatedExercises: ['Squat', 'Deadlift', 'Hip Thrust', 'Lateral Band Walk', 'Hip Flexor Stretch'],
        injuryRisks: ['Hip flexor strain', 'Labral tear', 'Hip impingement', 'Hip bursitis'],
        recoveryTips: ['Hip mobility drills', 'Glute strengthening', 'Avoid deep squats with pain'],
        warmUpTips: ['Hip circles', 'Hip 90/90 stretch', 'Dynamic lunges'],
        isActive: true,
      },
      {
        partId: 'ankle_joint', name: 'Ankle Joint', nameAr: 'مفصل الكاحل', nameKu: 'جومگەی قولەپێ',
        type: 'joint', region: 'lower_body', side: 'both',
        description: 'A hinge joint connecting the leg bones to the foot.',
        function: 'Plantarflexion and dorsiflexion of the foot. Weight bearing and propulsion.',
        relatedExercises: ['Calf Raise', 'Ankle Circles', 'Resistance Band Ankle Work', 'Balance Training'],
        injuryRisks: ['Ankle sprain (most common sports injury)', 'Achilles tendon rupture', 'Stress fractures'],
        recoveryTips: ['Balance/proprioception training', 'Peroneal strengthening', 'Gradual return to activity'],
        warmUpTips: ['Ankle circles', 'Calf raises', 'Single-leg balance'],
        isActive: true,
      },
      // ── ARTERIES ────────────────────────────────────────────────────────────
      {
        partId: 'aorta', name: 'Aorta', nameAr: 'الشريان الأورطي', nameKu: 'خوێنبەری سەرەکی (ئەئۆرتا)',
        type: 'artery', region: 'core', side: 'center',
        description: 'The largest artery in the body, originating from the left ventricle of the heart.',
        function: 'Carries oxygenated blood from the heart to the entire body.',
        relatedExercises: ['Cardiovascular training improves aortic health and elasticity'],
        injuryRisks: ['Aortic dissection (risk with extreme heavy lifting)', 'Hypertension'],
        recoveryTips: ['Regular cardio exercise', 'Blood pressure management', 'Avoid valsalva maneuver'],
        warmUpTips: ['Progressive warm-up before heavy lifting', 'Controlled breathing techniques'],
        isActive: true,
      },
      {
        partId: 'femoral_artery', name: 'Femoral Artery', nameAr: 'الشريان الفخذي', nameKu: 'خوێنبەری ڕان',
        type: 'artery', region: 'lower_body', side: 'both',
        description: 'The main blood supply to the lower limb, running through the femoral triangle.',
        function: 'Supplies oxygenated blood to the thigh, knee, and lower leg.',
        relatedExercises: ['Lower body training improves femoral blood flow and collateral circulation'],
        injuryRisks: ['Femoral artery entrapment syndrome in athletes', 'Compression during extreme hip flexion'],
        recoveryTips: ['Avoid prolonged compression of the groin area', 'Regular lower body movement'],
        warmUpTips: ['Light cardio before intense lower body work'],
        isActive: true,
      },
      // ── NERVES ──────────────────────────────────────────────────────────────
      {
        partId: 'sciatic_nerve', name: 'Sciatic Nerve', nameAr: 'العصب الوركي', nameKu: 'دەماری سیاتیک',
        type: 'nerve', region: 'lower_body', side: 'both',
        description: 'The longest and widest nerve in the human body, running from the lower back through the buttocks down each leg.',
        function: 'Controls muscles in the posterior thigh, leg, and foot. Provides sensation to most of the leg.',
        relatedExercises: ['Hip mobility work', 'Neural flossing', 'Piriformis stretches'],
        injuryRisks: ['Sciatica (radiating pain down the leg)', 'Piriformis syndrome', 'Disc herniation compressing the nerve'],
        symptoms: ['Sharp pain from lower back to foot', 'Numbness or tingling in the leg', 'Weakness in the foot'],
        recoveryTips: ['McKenzie exercises', 'Piriformis stretching', 'Avoid prolonged sitting', 'Core strengthening'],
        warmUpTips: ['Gentle hip stretches', 'Neural mobilization exercises before intense training'],
        isActive: true,
      },
      {
        partId: 'radial_nerve', name: 'Radial Nerve', nameAr: 'العصب الكعبري', nameKu: 'دەماری ڕادیاڵ',
        type: 'nerve', region: 'upper_body', side: 'both',
        description: 'The largest branch of the brachial plexus, running along the radial aspect of the arm.',
        function: 'Controls extension of the wrist and fingers. Provides sensation to the back of the hand.',
        relatedExercises: ['Wrist extension exercises', 'Forearm strengthening', 'Grip training'],
        injuryRisks: ['Radial nerve palsy (wrist drop)', 'Saturday night palsy from compression', 'Tennis elbow'],
        symptoms: ['Wrist drop', 'Weakness extending fingers', 'Numbness on back of hand'],
        recoveryTips: ['Avoid compression of the radial nerve groove', 'Wrist splinting if needed', 'Progressive strengthening'],
        warmUpTips: ['Wrist circles', 'Finger extensions', 'Forearm stretches'],
        isActive: true,
      },
      {
        partId: 'median_nerve', name: 'Median Nerve', nameAr: 'العصب المتوسط', nameKu: 'دەماری ناوەڕاستی دەست',
        type: 'nerve', region: 'upper_body', side: 'both',
        description: 'Passes through the carpal tunnel, providing sensation and motor control to the hand.',
        function: 'Controls forearm pronation, wrist flexion, and thumb opposition. Sensation to the palm side.',
        relatedExercises: ['Grip strengthening', 'Wrist flexion exercises', 'Median nerve flossing'],
        injuryRisks: ['Carpal tunnel syndrome', 'Pronator teres syndrome', 'Anterior interosseous nerve syndrome'],
        symptoms: ['Numbness in thumb, index, middle fingers', 'Weak grip', 'Night-time hand pain'],
        recoveryTips: ['Wrist splinting at night', 'Ergonomic adjustments', 'Stretching wrist flexors', 'Avoid repetitive flexion'],
        warmUpTips: ['Gentle wrist stretches', 'Nerve gliding exercises before repetitive tasks'],
        isActive: true,
      },
    ]);
    console.log('Anatomy data seeded');

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