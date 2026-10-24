"use client";

import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import {
  OrderStatus, Product, ProductCategory, ShopOrder, allOrders, errorMessage, hideProduct, listAllProducts, saveProduct, setOrderStatus,
} from '@/services/gymApi';

const money = (n: number) => `${n.toLocaleString('en-US')} IQD`;
const CATS: ProductCategory[] = ['supplement', 'drink', 'gear', 'apparel', 'membership', 'other'];
const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800';
const empty = { name: '', nameAr: '', nameKu: '', category: 'supplement' as ProductCategory, price: 0, stock: 0 };

export default function AdminShopPage() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<'orders' | 'products'>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [form, setForm] = useState<typeof empty & { _id?: string }>(empty);

  const load = () => {
    listAllProducts().then(setProducts).catch(() => {});
    allOrders().then(setOrders).catch(() => {});
  };
  useEffect(load, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await saveProduct(form, form._id);
      toast.success(t('common.saved'));
      setForm(empty);
      load();
    } catch (err) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  const status = async (o: ShopOrder, s: OrderStatus) => {
    try { await setOrderStatus(o._id, s); load(); } catch (err) { toast.error(errorMessage(err, t('common.error'))); }
  };

  const locale = lang === 'en' ? 'en-GB' : lang === 'ar' ? 'ar-IQ' : 'ckb-IQ';

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppShell>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-2xl font-bold">{t('nav.shopAdmin')}</h1>
            <div className="flex gap-1">
              {(['orders', 'products'] as const).map(x => (
                <button key={x} onClick={() => setTab(x)} className={`rounded-full px-3 py-1 text-sm ${tab === x ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  {t(x === 'orders' ? 'shop.orders' : 'shop.products')}
                </button>
              ))}
            </div>
          </div>

          {tab === 'orders' ? (
            <ul className="space-y-2">
              {orders.length === 0 && <li className="text-slate-500">{t('common.empty')}</li>}
              {orders.map(o => (
                <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                  <div className="min-w-0 text-sm">
                    <div className="font-semibold">{o.user?.name} <span className="font-normal text-slate-500" dir="ltr">{o.user?.phone}</span></div>
                    <div className="text-slate-600 dark:text-slate-300">{o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</div>
                    <div className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString(locale)} · <b dir="ltr">{money(o.total)}</b> · {t(`shop.status.${o.status}` as TranslationKey)}{o.note ? ` · “${o.note}”` : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    {o.status === 'pending' && <button onClick={() => status(o, 'ready')} className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm text-white">{t('shop.markReady')}</button>}
                    {(o.status === 'pending' || o.status === 'ready') && <button onClick={() => status(o, 'completed')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white">{t('shop.markDone')}</button>}
                    {(o.status === 'pending' || o.status === 'ready') && <button onClick={() => status(o, 'cancelled')} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600">{t('common.cancel')}</button>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800"><tr>
                    <th className="px-3 py-2 text-start">{t('shop.name')}</th>
                    <th className="px-3 py-2 text-start">{t('shop.category')}</th>
                    <th className="px-3 py-2 text-end">{t('common.price')}</th>
                    <th className="px-3 py-2 text-end">{t('shop.stock')}</th>
                    <th className="px-3 py-2" />
                  </tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p._id} className={`border-t border-slate-100 dark:border-slate-800 ${p.isActive === false ? 'opacity-40' : ''}`}>
                        <td className="px-3 py-2 font-medium">{p.name}</td>
                        <td className="px-3 py-2">{t(`shop.cat.${p.category}` as TranslationKey)}</td>
                        <td className="px-3 py-2 text-end tabular-nums" dir="ltr">{money(p.price)}</td>
                        <td className={`px-3 py-2 text-end tabular-nums ${p.stock < 5 ? 'font-bold text-red-600' : ''}`}>{p.stock}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-end">
                          <button onClick={() => setForm({ _id: p._id, name: p.name, nameAr: p.nameAr || '', nameKu: p.nameKu || '', category: p.category, price: p.price, stock: p.stock })} className="text-orange-600 hover:underline">✎</button>
                          {p.isActive !== false && <button onClick={() => hideProduct(p._id).then(load)} className="ms-3 text-red-600 hover:underline">{t('shop.hide')}</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form onSubmit={submit} className="h-fit space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="font-semibold">{form._id ? form.name : t('shop.newProduct')}</h2>
                <input required minLength={2} placeholder={`${t('shop.name')} (EN)`} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} />
                <input placeholder={`${t('shop.name')} (عربي)`} value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className={inputCls} dir="rtl" />
                <input placeholder={`${t('shop.name')} (کوردی)`} value={form.nameKu} onChange={e => setForm({ ...form, nameKu: e.target.value })} className={inputCls} dir="rtl" />
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as ProductCategory })} className={inputCls}>
                  {CATS.map(c => <option key={c} value={c}>{t(`shop.cat.${c}` as TranslationKey)}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs">{t('common.price')} (IQD)<input type="number" min={0} required value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className={inputCls} /></label>
                  <label className="text-xs">{t('shop.stock')}<input type="number" min={0} required value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className={inputCls} /></label>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 rounded-lg bg-orange-600 py-2 font-semibold text-white">{t('common.save')}</button>
                  {form._id && <button type="button" onClick={() => setForm(empty)} className="rounded-lg border px-3 dark:border-slate-700">{t('common.cancel')}</button>}
                </div>
              </form>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
