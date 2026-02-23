import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  Banknote,
  Check,
  AlertCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import type { Order } from '../App';

type PaymentMethod = 'cash' | 'debit';

interface PaymentCollectionModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (paymentData: PaymentData) => void;
}

export interface PaymentData {
  paymentMethod: PaymentMethod;
  tipAmount: number;
  // Cash-specific
  cashTendered?: number;
  changeGiven?: number;
  // Card-specific
  approvalCode?: string;
  cardLastFour?: string;
  cardBrand?: string;
}

const TIP_PRESETS = [0, 5, 10, 15];

export const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  order,
  isOpen,
  onClose,
  onComplete,
}) => {
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tipAmount, setTipAmount] = useState<number>(0);

  // Cash-specific state
  const [cashTendered, setCashTendered] = useState<string>('');
  const [changeGiven, setChangeGiven] = useState<number>(0);

  // Card-specific state
  const [approvalCode, setApprovalCode] = useState<string>('');
  const [cardLastFour, setCardLastFour] = useState<string>('');
  const [cardBrand, setCardBrand] = useState<string>('');

  // Validation
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate totals
  const totalWithTip = order.total + tipAmount;
  const cashTenderedNum = parseFloat(cashTendered) || 0;

  // Calculate change when cash tendered changes
  useEffect(() => {
    if (paymentMethod === 'cash' && cashTenderedNum > 0) {
      const change = cashTenderedNum - totalWithTip;
      setChangeGiven(Math.max(0, change));
    } else {
      setChangeGiven(0);
    }
  }, [cashTendered, totalWithTip, paymentMethod]);

  // Reset errors when inputs change
  useEffect(() => {
    setErrors([]);
  }, [paymentMethod, cashTendered, approvalCode, cardLastFour]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: string[] = [];

    if (paymentMethod === 'cash') {
      if (cashTenderedNum < totalWithTip) {
        newErrors.push('Cash tendered must be at least the total amount');
      }
    } else if (paymentMethod === 'debit') {
      if (!approvalCode.trim()) {
        newErrors.push('Approval code is required');
      }
      if (cardLastFour.length !== 4 || !/^\d{4}$/.test(cardLastFour)) {
        newErrors.push('Enter the last 4 digits of the card');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleComplete = async () => {
    if (!validate()) return;

    setIsSubmitting(true);

    const paymentData: PaymentData = {
      paymentMethod,
      tipAmount,
    };

    if (paymentMethod === 'cash') {
      paymentData.cashTendered = cashTenderedNum;
      paymentData.changeGiven = changeGiven;
    } else {
      paymentData.approvalCode = approvalCode.trim();
      paymentData.cardLastFour = cardLastFour;
      paymentData.cardBrand = cardBrand || 'unknown';
    }

    try {
      await onComplete(paymentData);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Failed to process payment']);
      setIsSubmitting(false);
    }
  };

  // Quick cash amounts
  const quickCashAmounts = [
    Math.ceil(totalWithTip),
    Math.ceil(totalWithTip / 10) * 10, // Round up to nearest 10
    Math.ceil(totalWithTip / 20) * 20, // Round up to nearest 20
    100,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= totalWithTip); // Unique & >= total

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center fade-in">
      <div className="bg-[#232437] rounded-t-[32px] p-6 w-full max-w-md slide-up max-h-[90vh] overflow-y-auto">
        {/* Handle */}
        <div className="w-12 h-1 bg-[#3A3D58] rounded-full mx-auto mb-4"></div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Collect Payment</h3>
          <button
            onClick={onClose}
            className="p-2 bg-[#1C1630] rounded-xl text-[#8E8AA0] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Total */}
        <div className="bg-[#1C1630] rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-[#C2BED0]">Order Total</span>
            <span className="text-2xl font-bold text-white">${order.total.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span className="text-[#8E8AA0]">+ Tip</span>
                <span className="text-[#F26A2E]">+${tipAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-[#3A3D58] mt-2 pt-2 flex justify-between items-center">
                <span className="text-[#C2BED0] font-medium">Total to Collect</span>
                <span className="text-2xl font-bold text-[#F26A2E]">${totalWithTip.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Payment Method Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setPaymentMethod('cash')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              paymentMethod === 'cash'
                ? 'bg-[#F26A2E] text-white'
                : 'bg-[#1C1630] text-[#C2BED0] border border-[#3A3D58]'
            }`}
          >
            <Banknote className="w-5 h-5" />
            Cash
          </button>
          <button
            onClick={() => setPaymentMethod('debit')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              paymentMethod === 'debit'
                ? 'bg-[#F26A2E] text-white'
                : 'bg-[#1C1630] text-[#C2BED0] border border-[#3A3D58]'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Debit
          </button>
        </div>

        {/* Tip Selection */}
        <div className="mb-6">
          <label className="text-[#8E8AA0] text-sm mb-2 block">Tip Amount</label>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {TIP_PRESETS.map((amount) => (
              <button
                key={amount}
                onClick={() => setTipAmount(amount)}
                className={`py-2.5 rounded-xl font-bold transition-all text-sm ${
                  tipAmount === amount
                    ? 'bg-[#F26A2E] text-white'
                    : 'bg-[#1C1630] text-[#C2BED0] border border-[#3A3D58]'
                }`}
              >
                {amount === 0 ? 'No Tip' : `$${amount}`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#8E8AA0] text-sm">Custom:</span>
            <div className="relative flex-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8AA0]" />
              <input
                type="number"
                value={tipAmount || ''}
                onChange={(e) => setTipAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-[#1C1630] border border-[#3A3D58] rounded-xl pl-9 pr-4 py-2.5 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#F26A2E]"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Details */}
        {paymentMethod === 'cash' ? (
          <div className="space-y-4 mb-6">
            {/* Quick Cash Buttons */}
            <div>
              <label className="text-[#8E8AA0] text-sm mb-2 block">Quick Select</label>
              <div className="grid grid-cols-4 gap-2">
                {quickCashAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setCashTendered(amount.toString())}
                    className={`py-2 rounded-xl font-bold transition-all text-sm ${
                      cashTenderedNum === amount
                        ? 'bg-[#F26A2E] text-white'
                        : 'bg-[#1C1630] text-[#C2BED0] border border-[#3A3D58]'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Tendered Input */}
            <div>
              <label className="text-[#8E8AA0] text-sm mb-2 block">Cash Tendered</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8AA0]" />
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-[#1C1630] border border-[#3A3D58] rounded-xl pl-12 pr-4 py-3 text-white text-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#F26A2E]"
                />
              </div>
            </div>

            {/* Change Due */}
            {cashTenderedNum >= totalWithTip && (
              <div className="bg-[#F26A2E]/10 border border-[#F26A2E]/30 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-[#F26A2E] font-medium">Change Due</span>
                  <span className="text-2xl font-bold text-[#F26A2E]">
                    ${changeGiven.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            {/* Approval Code */}
            <div>
              <label className="text-[#8E8AA0] text-sm mb-2 block">
                Approval Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={approvalCode}
                onChange={(e) => setApprovalCode(e.target.value.toUpperCase())}
                placeholder="Enter approval code"
                className="w-full bg-[#1C1630] border border-[#3A3D58] rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#F26A2E]"
              />
            </div>

            {/* Card Last Four */}
            <div>
              <label className="text-[#8E8AA0] text-sm mb-2 block">
                Last 4 Digits <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={cardLastFour}
                onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="XXXX"
                maxLength={4}
                className="w-full bg-[#1C1630] border border-[#3A3D58] rounded-xl px-4 py-3 text-white font-mono text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-[#F26A2E]"
              />
            </div>

            {/* Card Brand (Optional) */}
            <div>
              <label className="text-[#8E8AA0] text-sm mb-2 block">Card Brand (Optional)</label>
              <div className="grid grid-cols-4 gap-2">
                {['Visa', 'MC', 'Amex', 'Other'].map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setCardBrand(brand.toLowerCase())}
                    className={`py-2 rounded-xl text-sm font-medium transition-all ${
                      cardBrand === brand.toLowerCase()
                        ? 'bg-[#F26A2E] text-white'
                        : 'bg-[#1C1630] text-[#C2BED0] border border-[#3A3D58]'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6">
            {errors.map((error, idx) => (
              <div key={idx} className="flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-4 bg-[#1C1630] text-[#C2BED0] rounded-xl font-bold border border-[#3A3D58] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleComplete}
            disabled={isSubmitting || (paymentMethod === 'cash' && cashTenderedNum < totalWithTip)}
            className="flex-1 py-4 bg-[#F26A2E] text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Complete
              </>
            )}
          </button>
        </div>

        {/* ID Verification Reminder */}
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p className="text-amber-400 text-xs text-center">
            <span className="font-bold">Reminder:</span> Verify customer ID before completing delivery
          </p>
        </div>
      </div>
    </div>
  );
};
