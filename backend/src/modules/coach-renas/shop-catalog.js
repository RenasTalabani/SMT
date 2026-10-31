'use strict';

// Coach Renas shop — SAMPLE products and prices from the prototype
// ("مع الكوتش ريناس" + the review sheet). The server computes order totals
// from this list, never from the phone. Replace with real products/prices.
const PRODUCTS = [
  { key: 'whey', name: 'واي بروتين 2 كغ', cat: 'supp', price: 65000 },
  { key: 'creatine', name: 'كرياتين 300 غ', cat: 'supp', price: 30000 },
  { key: 'bar', name: 'لوح بروتين', cat: 'food', price: 2500 },
  { key: 'water', name: 'ماي 500 مل', cat: 'food', price: 500 },
  { key: 'gloves', name: 'كفوف تمرين', cat: 'gear', price: 12000 },
  { key: 'belt', name: 'حزام رفع أثقال', cat: 'gear', price: 25000 },
  { key: 'plates', name: 'أقراص صغيرة 0.5–1.25 كغ', cat: 'gear', price: 18000 },
  { key: 'shaker', name: 'شيكر', cat: 'gear', price: 7000 },
  { key: 'tshirt', name: 'تيشيرت الكوتش ريناس', cat: 'wear', price: 15000 },
  { key: 'stack', name: 'باكج الكوتش للمبتدئين', cat: 'supp', price: 89000 },
];

const DELIVERY_IQD = 5000; // SAMPLE: one price for all Iraq (review sheet: "حالياً 5,000 لكل العراق")

const GOVS = ['بغداد', 'أربيل', 'البصرة', 'السليمانية', 'نينوى', 'النجف', 'كربلاء', 'دهوك', 'كركوك', 'بابل',
  'الأنبار', 'ديالى', 'واسط', 'ذي قار', 'ميسان', 'المثنى', 'القادسية', 'صلاح الدين', 'حلبجة'];

module.exports = { PRODUCTS, DELIVERY_IQD, GOVS };
