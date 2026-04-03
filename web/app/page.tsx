import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-10">
      <h1 className="mb-4 text-4xl font-bold">Ultimate Gym System</h1>
      <p className="mb-8 text-lg text-slate-600 dark:text-slate-300">Role-based workout management, coaching, courses, and progress tracking in one platform.</p>
      <div className="flex gap-3">
        <Link href="/auth/login" className="rounded-md bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700">Login</Link>
        <Link href="/auth/register" className="rounded-md border border-slate-300 px-5 py-2.5 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Register</Link>
      </div>
    </main>
  );
}
