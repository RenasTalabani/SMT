import type { Metadata } from 'next';
import { Cairo, IBM_Plex_Sans_Arabic } from 'next/font/google';
import CoachRenasLanding from './landing';

const cairo = Cairo({ subsets: ['arabic', 'latin'], weight: ['700', '800'], variable: '--font-cairo' });
const plex = IBM_Plex_Sans_Arabic({ subsets: ['arabic', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-plex-ar' });

export const metadata: Metadata = {
  title: 'مع الكوتش ريناس · Coach Renas',
  description: 'تمرين بطريقة الكوتش، أكل عراقي وسعرات، مكملات بصدق، وتدريب شخصي 1-على-1 ويه الكوتش ريناس. Training, Iraqi food and 1-on-1 coaching with Coach Renas.',
  openGraph: {
    title: 'مع الكوتش ريناس · Coach Renas',
    description: 'Train right. Get stronger. — Iraqi coaching app: training, Iraqi food, honest supplements.',
    type: 'website',
  },
};

export default function CoachRenasPage() {
  return (
    <div className={`${cairo.variable} ${plex.variable}`}>
      <CoachRenasLanding />
    </div>
  );
}
