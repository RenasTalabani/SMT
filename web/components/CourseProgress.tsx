import { Course, CourseEnrollment } from '@/store/coursesSlice';

interface CourseProgressProps {
  enrollment: CourseEnrollment;
  course: Course;
  onProgressUpdate: (progress: Record<string, unknown>) => void;
}

export default function CourseProgress({ enrollment, course, onProgressUpdate }: CourseProgressProps) {
  const handleMaterialComplete = (weekIndex: number, materialIndex: number) => {
    const progress = {
      week: weekIndex,
      material: materialIndex,
      completed: true,
      completedAt: new Date()
    };
    onProgressUpdate(progress);
  };

  const getMaterialProgress = (weekIndex: number, materialIndex: number) => {
    return enrollment.progress.find(
      p => p.week === weekIndex && p.material === materialIndex
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Your Progress
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300 mb-1">
              <span>Overall Completion</span>
              <span>{enrollment.overallProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${enrollment.overallProgress}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {enrollment.completedWeeks.length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Weeks Completed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {enrollment.progress.filter(p => p.completed).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Materials Completed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {enrollment.completedAt ? 'Completed' : 'In Progress'}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Status
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress */}
      <div className="space-y-4">
        {course.content.weeks.map((week, weekIndex) => {
          const weekCompleted = enrollment.completedWeeks.includes(weekIndex);
          const weekMaterials = week.materials.length;
          const completedMaterials = enrollment.progress.filter(
            p => p.week === weekIndex && p.completed
          ).length;

          return (
            <div key={weekIndex} className="bg-white dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Week {weekIndex + 1}: {week.title}
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    weekCompleted
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                  }`}>
                    {weekCompleted ? 'Completed' : 'In Progress'}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {completedMaterials}/{weekMaterials} materials
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {week.materials.map((material, materialIndex) => {
                  const progress = getMaterialProgress(weekIndex, materialIndex);
                  const isCompleted = progress?.completed || false;

                  return (
                    <div key={materialIndex} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex-shrink-0">
                        {material.type === 'video' && (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCompleted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
                          }`}>
                            <svg className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                        )}
                        {material.type === 'document' && (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCompleted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-blue-100 dark:bg-blue-900/20'
                          }`}>
                            <svg className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        {material.type === 'exercise' && (
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCompleted ? 'bg-green-100 dark:bg-green-900/20' : 'bg-green-100 dark:bg-green-900/20'
                          }`}>
                            <svg className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-green-600'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-slate-900 dark:text-slate-100">
                          {material.title}
                        </h5>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          {material.type.charAt(0).toUpperCase() + material.type.slice(1)}
                          {material.duration && ` • ${material.duration} min`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm">Completed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleMaterialComplete(weekIndex, materialIndex)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}