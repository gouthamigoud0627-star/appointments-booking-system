/**
 * BusinessOffers.tsx
 * Real Business Offers & Promotions Management Hub for Business Owners
 * Supports creating, editing, activating, pausing, deleting, and auditing offers.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag,
  PlusCircle,
  Percent,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Gift,
  Building2,
  Search,
  ChevronRight,
  X,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  BusinessOffer,
  getStoredOffers,
  saveStoredOffers,
  createBusinessOffer,
  updateBusinessOffer,
  toggleOfferStatus,
  deleteBusinessOffer,
  getStoredRedemptions,
} from '../lib/offers';

export default function BusinessOffers() {
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || 'biz-bloom-spa';
  const businessName = currentBusiness?.name || 'My Practice';
  const businessServices = currentBusiness?.services || [];

  const [offers, setOffers] = useState<BusinessOffer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingOffer, setEditingOffer] = useState<BusinessOffer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [applicableServices, setApplicableServices] = useState<string[]>(['all']);
  const [offerType, setOfferType] = useState<'percentage' | 'fixed' | 'free_service' | 'special_package'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [originalPrice, setOriginalPrice] = useState<number>(100);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [maxRedemptions, setMaxRedemptions] = useState<number>(50);
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(1);
  const [couponCode, setCouponCode] = useState('');
  const [terms, setTerms] = useState('Valid for appointments booked via Schedora. Prior reservation required.');
  const [newCustomerOnly, setNewCustomerOnly] = useState<boolean>(false);
  const [branch, setBranch] = useState(currentBusiness?.address || 'Main Branch');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadOffers = () => {
    setLoading(true);
    try {
      const all = getStoredOffers();
      const bizOffers = all.filter((o) => o.businessId === businessId);
      setOffers(bizOffers);
    } catch (e) {
      console.error('Failed to load business offers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, [businessId]);

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setTitle('');
    setDescription('');
    setApplicableServices(['all']);
    setOfferType('percentage');
    setDiscountValue(20);
    setOriginalPrice(100);
    setStartDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    setExpiryDate(d.toISOString().split('T')[0]);
    setMaxRedemptions(50);
    setPerCustomerLimit(1);
    setCouponCode('');
    setTerms('Valid for appointments booked via Schedora. Prior reservation required.');
    setNewCustomerOnly(false);
    setShowModal(true);
  };

  const handleOpenEdit = (offer: BusinessOffer) => {
    setEditingOffer(offer);
    setTitle(offer.title);
    setDescription(offer.description);
    setApplicableServices(offer.applicableServices);
    setOfferType(offer.offerType);
    setDiscountValue(offer.discountValue);
    setOriginalPrice(offer.originalPrice || 100);
    setStartDate(offer.startDate || '');
    setExpiryDate(offer.expiryDate || '');
    setMaxRedemptions(offer.maxRedemptions);
    setPerCustomerLimit(offer.perCustomerLimit);
    setCouponCode(offer.couponCode || '');
    setTerms(offer.terms);
    setNewCustomerOnly(offer.newCustomerOnly);
    setShowModal(true);
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await toggleOfferStatus(id);
      showToast(`Offer is now ${updated.status === 'active' ? 'active' : 'paused'}.`);
      loadOffers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      await deleteBusinessOffer(id);
      showToast('Offer deleted.');
      loadOffers();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalPriceCalc = originalPrice;
    if (offerType === 'free_service') finalPriceCalc = 0;
    else if (offerType === 'percentage') finalPriceCalc = Math.max(0, originalPrice - (originalPrice * discountValue) / 100);
    else finalPriceCalc = Math.max(0, originalPrice - discountValue);

    const names = applicableServices.includes('all')
      ? ['All Services']
      : businessServices.filter((s: any) => applicableServices.includes(s.id)).map((s: any) => s.name);

    try {
      if (editingOffer) {
        await updateBusinessOffer(editingOffer.id, {
          title,
          description,
          applicableServices,
          applicableServiceNames: names,
          offerType,
          discountValue: Number(discountValue),
          originalPrice: Number(originalPrice),
          finalPrice: finalPriceCalc,
          startDate,
          expiryDate,
          maxRedemptions: Number(maxRedemptions),
          perCustomerLimit: Number(perCustomerLimit),
          couponCode: couponCode.trim().toUpperCase() || undefined,
          terms,
          newCustomerOnly,
          branches: [branch],
        });
        showToast('Offer updated successfully.');
      } else {
        await createBusinessOffer({
          businessId,
          businessName,
          businessSlug: currentBusiness?.slug || 'practice',
          businessCategory: currentBusiness?.category || 'Spa',
          businessAddress: currentBusiness?.address || '',
          businessCity: currentBusiness?.city || 'San Francisco',
          businessState: currentBusiness?.state || 'CA',
          businessCountry: currentBusiness?.country || 'United States',
          latitude: currentBusiness?.latitude || 37.7895,
          longitude: currentBusiness?.longitude || -122.4082,
          title,
          description,
          applicableServices,
          applicableServiceNames: names,
          offerType,
          discountValue: Number(discountValue),
          currency: (currentBusiness?.currency as any) || 'USD',
          originalPrice: Number(originalPrice),
          finalPrice: finalPriceCalc,
          startDate,
          expiryDate,
          status: 'active',
          maxRedemptions: Number(maxRedemptions),
          perCustomerLimit: Number(perCustomerLimit),
          couponCode: couponCode.trim().toUpperCase() || undefined,
          terms,
          newCustomerOnly,
          branches: [branch],
        });
        showToast('New offer created and published.');
      }
      setShowModal(false);
      loadOffers();
    } catch (err: any) {
      alert('Failed to save offer: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Business Offers & Promotions
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
              {offers.length} Published
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create, pause, activate, and manage discounts shown on "Offers Near You" and booking pages.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Offer</span>
        </button>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading business promotions...</div>
      ) : offers.length === 0 ? (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Gift className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Offers Created Yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Boost bookings and attract nearby customers by creating a first-time discount, seasonal special, or complimentary consultation offer.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Create Your First Offer
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const isPaused = offer.status === 'paused';
            return (
              <div
                key={offer.id}
                className={`bg-white dark:bg-slate-850 rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs ${
                  isPaused
                    ? 'border-slate-200 dark:border-slate-800 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar with Badge & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        offer.offerType === 'free_service'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                      }`}
                    >
                      {offer.offerType === 'free_service'
                        ? '100% Free'
                        : offer.offerType === 'percentage'
                        ? `${offer.discountValue}% OFF`
                        : `${offer.currency === 'INR' ? '₹' : '$'}${offer.discountValue} OFF`}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPaused
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      {isPaused ? 'Paused' : 'Active'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">
                      {offer.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {offer.description}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Coupon Code:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {offer.couponCode || 'No code required'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Redemptions:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {offer.redemptionsCount} / {offer.maxRedemptions || '∞'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Valid Until:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {offer.expiryDate || 'Ongoing'}
                      </span>
                    </div>

                    {offer.newCustomerOnly && (
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 pt-1">
                        ★ New customers only
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Card Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                  <button
                    onClick={() => handleToggle(offer.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isPaused
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    {isPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    <span>{isPaused ? 'Activate' : 'Pause'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(offer)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Offer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingOffer ? 'Edit Business Offer' : 'Create New Offer & Promotion'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Offer Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 50% Off First Deep Conditioning Hair Spa"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what customers receive and why they should book..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Offer Type
                  </label>
                  <select
                    value={offerType}
                    onChange={(e) => setOfferType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Amount Discount</option>
                    <option value="free_service">100% Free Consultation / Service</option>
                    <option value="special_package">Special Package Bundle</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    {offerType === 'percentage'
                      ? 'Discount Value (%)'
                      : offerType === 'free_service'
                      ? 'Free Value Benefit'
                      : 'Discount Value ($/₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxRedemptions}
                    onChange={(e) => setMaxRedemptions(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Per-Customer Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={perCustomerLimit}
                    onChange={(e) => setPerCustomerLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SUMMER50"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newCustomerOnly"
                  checked={newCustomerOnly}
                  onChange={(e) => setNewCustomerOnly(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="newCustomerOnly" className="font-bold text-slate-700 dark:text-slate-300">
                  New customers only (First appointment at this business)
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Terms & Conditions
                </label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                >
                  {editingOffer ? 'Update Offer' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
