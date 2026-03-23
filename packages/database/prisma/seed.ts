import { prisma } from '../src/client';

const API_URL = process.env.API_URL || 'http://localhost:3001';

const TEST_TRAINER = {
  name: 'Coach Sarah',
  email: 'test-trainer@fitnassist.dev',
  password: 'Test1234!',
  role: 'TRAINER' as const,
};

const TEST_TRAINEE = {
  name: 'Alex Johnson',
  email: 'test-trainee@fitnassist.dev',
  password: 'Test1234!',
  role: 'TRAINEE' as const,
};

const signUp = async (data: { name: string; email: string; password: string; role: string }) => {
  const res = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

async function main() {
  console.log('Starting seed...');

  // Clean up any existing test data
  const existingTrainer = await prisma.user.findUnique({ where: { email: TEST_TRAINER.email } });
  const existingTrainee = await prisma.user.findUnique({ where: { email: TEST_TRAINEE.email } });

  if (existingTrainer) {
    await prisma.user.delete({ where: { id: existingTrainer.id } });
    console.log('Cleaned up existing trainer');
  }
  if (existingTrainee) {
    await prisma.user.delete({ where: { id: existingTrainee.id } });
    console.log('Cleaned up existing trainee');
  }

  // Register users via API (handles password hashing)
  console.log('Registering test trainer...');
  await signUp(TEST_TRAINER);

  console.log('Registering test trainee...');
  await signUp(TEST_TRAINEE);

  // Verify emails
  const trainerUser = await prisma.user.findUnique({ where: { email: TEST_TRAINER.email } });
  const traineeUser = await prisma.user.findUnique({ where: { email: TEST_TRAINEE.email } });

  if (!trainerUser || !traineeUser) {
    throw new Error('Failed to create test users - is the API running?');
  }

  await prisma.user.updateMany({
    where: { id: { in: [trainerUser.id, traineeUser.id] } },
    data: { emailVerified: true },
  });
  console.log('Verified emails');

  // Create trainer profile
  const trainerProfile = await prisma.trainerProfile.create({
    data: {
      userId: trainerUser.id,
      handle: 'coach-sarah',
      displayName: 'Coach Sarah',
      bio: 'Certified personal trainer with 8 years of experience. Specialising in strength training, HIIT, and nutrition coaching. I help busy professionals get fit without spending hours in the gym.',
      qualifications: ['Level 3 Personal Training', 'Level 2 Gym Instructor', 'First Aid Certified'],
      services: ['Personal Training', 'Online Coaching', 'Nutrition Plans', 'HIIT'],
      postcode: 'SW1A 1AA',
      city: 'London',
      county: 'Greater London',
      country: 'GB',
      latitude: 51.5014,
      longitude: -0.1419,
      contactEmail: TEST_TRAINER.email,
      phoneNumber: '+44 7700 900123',
      travelOption: 'BOTH',
      isPublished: true,
    },
  });
  console.log('Created trainer profile:', trainerProfile.handle);

  // Create trainee profile
  await prisma.traineeProfile.create({
    data: {
      userId: traineeUser.id,
      bio: 'Looking to get in shape and build strength. New to the gym but motivated!',
      gender: 'MALE',
      dateOfBirth: new Date('1995-06-15'),
      heightCm: 178,
      startWeightKg: 82,
      goalWeightKg: 75,
      unitPreference: 'METRIC',
      experienceLevel: 'BEGINNER',
      activityLevel: 'LIGHTLY_ACTIVE',
      fitnessGoals: ['WEIGHT_LOSS', 'BUILD_MUSCLE', 'IMPROVE_FITNESS'],
      fitnessGoalNotes: 'Want to lose some weight and build lean muscle. Aiming to be more consistent.',
      location: 'London, UK',
      isPublic: true,
    },
  });
  console.log('Created trainee profile');

  // Create an accepted connection between them with messages
  const connection = await prisma.contactRequest.create({
    data: {
      trainerId: trainerProfile.id,
      senderId: traineeUser.id,
      type: 'CONNECTION_REQUEST',
      name: TEST_TRAINEE.name,
      email: TEST_TRAINEE.email,
      message: 'Hi Coach Sarah! I saw your profile and would love to work with you on my fitness goals.',
      status: 'ACCEPTED',
      respondedAt: new Date(),
    },
  });
  console.log('Created accepted connection');

  // Create a pending connection request (for requests page)
  await prisma.contactRequest.create({
    data: {
      trainerId: trainerProfile.id,
      senderId: traineeUser.id,
      type: 'CALLBACK_REQUEST',
      name: 'Jamie Wilson',
      email: 'jamie@example.com',
      phone: '+44 7700 900456',
      message: 'Hi, could you call me about your training packages?',
      status: 'PENDING',
    },
  });
  console.log('Created pending callback request');

  // Create messages in the accepted connection
  const now = new Date();
  const messages = [
    {
      connectionId: connection.id,
      senderId: traineeUser.id,
      content: 'Hi Coach Sarah! I saw your profile and would love to work with you on my fitness goals.',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      connectionId: connection.id,
      senderId: trainerUser.id,
      content: 'Hey Alex! Thanks for reaching out. I would love to help you achieve your goals. Can you tell me a bit more about your current routine?',
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
    },
    {
      connectionId: connection.id,
      senderId: traineeUser.id,
      content: 'Right now I go to the gym about 2-3 times a week, mostly cardio. I want to start doing more strength training but not sure where to start.',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      connectionId: connection.id,
      senderId: trainerUser.id,
      content: 'That is a great base to build on! I would suggest we start with a 3-day full body programme. I will put together a plan for you. When are you free for an initial consultation?',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  await prisma.message.createMany({ data: messages });
  console.log('Created', messages.length, 'messages');

  console.log('\nSeed completed!');
  console.log('---');
  console.log('Trainer login:', TEST_TRAINER.email, '/', TEST_TRAINER.password);
  console.log('Trainee login:', TEST_TRAINEE.email, '/', TEST_TRAINEE.password);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
