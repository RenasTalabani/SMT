'use strict';
// SAMPLE data for the demo / first install. Every item is marked "[SAMPLE]"
// and has a SAMPLE-stamped picture. Replace with real products, prices,
// photos and coaches before going live (see ../SAMPLE-DATA.md).

const img = (file) => `/sample/products/${file}.svg`;

const products = [
  { key: 'whey', name: 'Whey Protein 2 kg', nameAr: 'بروتين واي 2 كغ', nameKu: 'پرۆتینی وەی ٢ کگ', category: 'supplement', price: 65000, stock: 20, description: '[SAMPLE] 24 g protein per scoop, chocolate flavour.' },
  { key: 'creatine', name: 'Creatine Monohydrate 300 g', nameAr: 'كرياتين 300 غ', nameKu: 'کریاتین ٣٠٠ گ', category: 'supplement', price: 30000, stock: 15, description: '[SAMPLE] 5 g a day, unflavoured.' },
  { key: 'preworkout', name: 'Pre-workout 30 servings', nameAr: 'مكمل ما قبل التمرين', nameKu: 'پێش ڕاهێنان ٣٠ جار', category: 'supplement', price: 40000, stock: 10, description: '[SAMPLE] Take 20 minutes before training.' },
  { key: 'bcaa', name: 'BCAA 400 g', nameAr: 'أحماض أمينية BCAA', nameKu: 'BCAA ٤٠٠ گ', category: 'supplement', price: 35000, stock: 12, description: '[SAMPLE] Mango flavour, 40 servings.' },
  { key: 'bar', name: 'Protein bar', nameAr: 'لوح بروتين', nameKu: 'شیرینی پرۆتین', category: 'drink', price: 2500, stock: 100, description: '[SAMPLE] 20 g protein.' },
  { key: 'water', name: 'Water 500 ml', nameAr: 'ماء 500 مل', nameKu: 'ئاو ٥٠٠ مل', category: 'drink', price: 500, stock: 200, description: '[SAMPLE] Cold from the reception fridge.' },
  { key: 'energy', name: 'Energy drink 250 ml', nameAr: 'مشروب طاقة', nameKu: 'خواردنەوەی وزە', category: 'drink', price: 1500, stock: 60, description: '[SAMPLE] Sugar-free.' },
  { key: 'shaker', name: 'City Gym shaker', nameAr: 'شيكر سيتي جيم', nameKu: 'شەیکەری سیتی جیم', category: 'gear', price: 7000, stock: 40, description: '[SAMPLE] 700 ml, leak-proof.' },
  { key: 'gloves', name: 'Lifting gloves', nameAr: 'قفازات رفع', nameKu: 'دەستکێشی ڕاهێنان', category: 'gear', price: 12000, stock: 25, description: '[SAMPLE] Sizes S–XL.' },
  { key: 'belt', name: 'Lifting belt', nameAr: 'حزام رفع الأثقال', nameKu: 'پشتێنی قورسایی', category: 'gear', price: 25000, stock: 8, description: '[SAMPLE] Leather, 10 cm.' },
  { key: 'tshirt', name: 'City Gym T-shirt', nameAr: 'تيشيرت سيتي جيم', nameKu: 'تیشێرتی سیتی جیم', category: 'apparel', price: 15000, stock: 30, description: '[SAMPLE] Dry-fit, black.' },
  { key: 'month1', name: 'Monthly membership', nameAr: 'اشتراك شهري', nameKu: 'بەشداری مانگانە', category: 'membership', price: 35000, stock: 999, description: '[SAMPLE] Unlimited gym access for 30 days.' },
  { key: 'month3', name: '3-month membership', nameAr: 'اشتراك 3 أشهر', nameKu: 'بەشداری ٣ مانگ', category: 'membership', price: 95000, stock: 999, description: '[SAMPLE] Save 10,000 IQD.' },
].map(({ key, ...p }) => ({ ...p, imageUrl: img(key) }));

const coachAvatars = {
  'ahmed@gym.com': '/sample/coaches/ahmed.svg',
  'sara@gym.com': '/sample/coaches/sara.svg',
  'karwan@gym.com': '/sample/coaches/karwan.svg',
  'lana@gym.com': '/sample/coaches/lana.svg',
};

module.exports = { products, coachAvatars };
