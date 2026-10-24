"use client";

import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { FiMinus, FiPlus, FiShoppingBag } from 'react-icons/fi';
import AppShell from '@/components/AppShell';
import ProtectedRoute from '@/components/ProtectedRoute';
import { localized, useI18n } from '@/lib/i18n';
import { TranslationKey } from '@/lib/translations';
import { Product, ShopOrder, errorMessage, listProducts, myOrders, placeOrder, setOrderStatus } from '@/services/gymApi';

const money = (n: number) => `${n.toLocaleString('en-US')} IQD`;

const ORDER_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  ready: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  completed: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200',
};

export default function ShopPage() {
  const { t, lang } = useI18n();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cat, setCat] = useState<string>('all');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    listProducts().then(setProducts).catch(e => setError(errorMessage(e, t('common.error'))));
    myOrders().then(setOrders).catch(() => setOrders([]));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cats = useMemo(() => ['all', ...Array.from(new Set((products ?? []).map(p => p.category)))], [products]);
  const shown = (products ?? []).filter(p => cat === 'all' || p.category === cat);
  const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([id, q]) => ({ p: products?.find(x => x._id === id), q })).filter(l => l.p) as { p: Product; q: number }[];
  const total = lines.reduce((s, l) => s + l.p.price * l.q, 0);

  const change = (p: Product, d: number) =>
    setCart(c => ({ ...c, [p._id]: Math.max(0, Math.min(p.stock, (c[p._id] ?? 0) + d)) }));

  const checkout = async () => {
    setBusy(true);
    try {
      await placeOrder(lines.map(l => ({ productId: l.p._id, quantity: l.q })), note || undefined);
      toast.success(t('shop.ordered'));
      setCart({});
      setNote('');
      load();
    } catch (e) {
      toast.error(errorMessage(e, t('common.error')));
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (o: ShopOrder) => {
    try { await setOrderStatus(o._id, 'cancelled'); load(); } catch (e) { toast.error(errorMessage(e, t('common.error'))); }
  };

  return (
    <ProtectedRoute allowedRoles={['client']}>
      <AppShell>
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{t('shop.title')}</h1>
            <p className="text-slate-600 dark:text-slate-300">{t('shop.subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1 text-sm ${cat === c ? 'bg-orange-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {c === 'all' ? t('common.all') : t(`shop.cat.${c}` as TranslationKey)}
              </button>
            ))}
          </div>
          {error && <p className="text-red-600">{error}</p>}
          {!products && !error && <p className="text-slate-500">{t('common.loading')}</p>}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map(p => (
                <div key={p._id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mb-2 flex h-24 items-center justify-center rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 text-4xl dark:from-orange-900/30 dark:to-slate-800">
                    {p.category === 'supplement' ? '💪' : p.category === 'drink' ? '🥤' : p.category === 'membership' ? '🎫' : '🏋️'}
                  </div>
                  <h3 className="font-semibold">{localized(p, 'name', lang)}</h3>
                  {p.description && <p className="text-xs text-slate-500">{p.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div>
                      <div className="font-bold tabular-nums" dir="ltr">{money(p.price)}</div>
                      <div className={`text-xs ${p.stock > 0 ? 'text-slate-500' : 'text-red-600'}`}>{p.stock > 0 ? t('shop.left', { n: p.stock }) : t('shop.outOfStock')}</div>
                    </div>
                    {(cart[p._id] ?? 0) > 0 ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => change(p, -1)} className="rounded-full border p-1.5 dark:border-slate-700" aria-label="-"><FiMinus /></button>
                        <span className="w-5 text-center tabular-nums">{cart[p._id]}</span>
                        <button onClick={() => change(p, 1)} className="rounded-full border p-1.5 dark:border-slate-700" aria-label="+"><FiPlus /></button>
                      </div>
                    ) : (
                      <button disabled={p.stock < 1} onClick={() => change(p, 1)} className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">{t('shop.add')}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <aside className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0">
              <h2 className="flex items-center gap-2 font-semibold"><FiShoppingBag /> {t('shop.cart')}</h2>
              {lines.length === 0 ? <p className="text-sm text-slate-500">{t('shop.cartEmpty')}</p> : (
                <>
                  <ul className="space-y-1 text-sm">
                    {lines.map(l => (
                      <li key={l.p._id} className="flex justify-between gap-2"><span>{l.q} × {localized(l.p, 'name', lang)}</span><span className="tabular-nums" dir="ltr">{money(l.p.price * l.q)}</span></li>
                    ))}
                  </ul>
                  <div className="flex justify-between border-t pt-2 font-bold dark:border-slate-700"><span>{t('shop.total')}</span><span dir="ltr">{money(total)}</span></div>
                  <input value={note} onChange={e => setNote(e.target.value)} maxLength={300} placeholder={t('shop.note')} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800" />
                  <button onClick={checkout} disabled={busy} className="w-full rounded-lg bg-orange-600 py-2 font-semibold text-white disabled:opacity-50">{busy ? t('common.loading') : t('shop.checkout')}</button>
                </>
              )}
              {orders.length > 0 && (
                <div className="border-t pt-3 dark:border-slate-700">
                  <h3 className="mb-2 text-sm font-semibold">{t('shop.myOrders')}</h3>
                  <ul className="space-y-2">
                    {orders.slice(0, 8).map(o => (
                      <li key={o._id} className="rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="tabular-nums" dir="ltr">{money(o.total)}</span>
                          <span className={`rounded-full px-2 py-0.5 ${ORDER_STYLE[o.status]}`}>{t(`shop.status.${o.status}` as TranslationKey)}</span>
                        </div>
                        <div className="text-slate-500">{o.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</div>
                        {o.status === 'pending' && <button onClick={() => cancel(o)} className="mt-1 text-red-600 underline">{t('common.cancel')}</button>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
