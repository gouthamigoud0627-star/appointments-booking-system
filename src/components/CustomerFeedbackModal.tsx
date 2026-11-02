/**
 * Customer Feedback Modal
 * Allows clients to rate their experience (1-5 stars) and leave comments
 * after a confirmed or completed appointment.
 */

import React, { useState } from 'react';
import {
  Star,
  X,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  Store,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { addReview } from '../lib/reviews.js';

interface CustomerFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    businessId: string;
    businessName: string;
    serviceName: string;
    staffName?: string;
    date: string;
    customerName: string;
    customerEmail?: string;
  } | null;
  onSuccess?: (newReview: any) => void;
}

const FEEDBACK_TAGS = [
  'Punctual & On Time',
  'Expert Specialist',
  'Clean & Sanitized',
  'Friendly & Welcoming',
  'Great Value',
  'Gentle Care',
  'Quiet & Relaxing',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Disappointing',
  2: 'Fair Experience',
  3: 'Good Service',
  4: 'Very Good & Professional',
  5: 'Exceptional — Highly Recommended!',
};

export const CustomerFeedbackModal: React.FC<CustomerFeedbackModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  if (!isOpen || !booking) return null;

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Punctual & On Time']);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please share a short comment about your experience.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const reviewPayload = {
        appointmentId: booking.id,
        businessId: booking.businessId,
        businessName: booking.businessName,
        customerName: booking.customerName || 'Valued Client',
        customerEmail: booking.customerEmail,
        rating,
        comment: comment.trim(),
        serviceName: booking.serviceName,
        staffName: booking.staffName,
        tags: selectedTags,
      };

      const result = await addReview(reviewPayload);

      setSubmitted(true);
      if (onSuccess) {
        onSuccess(result);
      }

      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setComment('');
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      setError(err?.message || 'Could not save feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-b border-slate-100 dark:border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Star className="w-5 h-5 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Rate Your Experience
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {booking.businessName} • {booking.serviceName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Thank You For Your Feedback!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Your verified review helps {booking.businessName} and other clients in the community.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 rounded-xl text-xs">
                {error}
              </div>
            )}

            {/* Star Rating Selector */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-650'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {RATING_LABELS[hoverRating || rating]}
              </p>
            </div>

            {/* Quick Experience Tags */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                What went well?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FEEDBACK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Comments */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Your Review & Comments
              </label>
              <textarea
                required
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share specific details about the specialist, timing, cleanliness, or results..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Appointment Context Details */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Verified Appointment: {booking.date}
              </span>
              {booking.staffName && (
                <span>Specialist: {booking.staffName}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-750"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5"
              >
                {submitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Verified Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
