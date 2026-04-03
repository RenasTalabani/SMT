import { Course } from '@/store/coursesSlice';

interface CourseContentProps {
  course: Course;
}

export default function CourseContent({ course }: CourseContentProps) {
  return (
    <div className="space-y-6">
      {course.content.weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="border border-slate-200 dark:border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Week {weekIndex + 1}: {week.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {week.description}
          </p>

          <div className="space-y-4">
            {week.materials.map((material, materialIndex) => (
              <div key={materialIndex} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex-shrink-0">
                  {material.type === 'video' && (
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                  )}
                  {material.type === 'document' && (
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {material.type === 'exercise' && (
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100">
                    {material.title}
                  </h4>
                  {material.type === 'video' && material.duration && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Duration: {material.duration} minutes
                    </p>
                  )}
                  {material.url && (
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View {material.type}
                    </a>
                  )}
                </div>
              </div>
            ))}

            {week.exercises.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Exercises for this week:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {week.exercises.map((exerciseId, exerciseIndex) => (
                    <span
                      key={exerciseIndex}
                      className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full text-sm"
                    >
                      Exercise {exerciseIndex + 1}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}