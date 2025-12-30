'use client';

import { useState } from 'react';
import { Check, CreditCard, Package, Send, Clock, CheckCircle, FileText, Download, ArrowRight, Calendar } from 'lucide-react';

type PlanType = 'foundation' | 'deep-dive' | 'optimizer';

interface TestKit {
  id: number;
  status: 'pending' | 'shipped' | 'in-use' | 'returned' | 'processing' | 'completed';
  scheduledDate: string;
  shippedDate?: string;
  returnedDate?: string;
  completedDate?: string;
  trackingNumber?: string;
}

interface BillingHistoryItem {
  id: string;
  date: string;
  amount: number;
  description: string;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanType>('deep-dive');
  const [paymentMethod, setPaymentMethod] = useState({
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiryMonth: '12',
    expiryYear: '2025',
  });

  // Mock test kits data - based on The Deep Dive plan (2 tests per year)
  const [testKits] = useState<TestKit[]>([
    {
      id: 1,
      status: 'completed',
      scheduledDate: '2024-01-15',
      shippedDate: '2024-01-10',
      returnedDate: '2024-01-25',
      completedDate: '2024-02-05',
      trackingNumber: 'TRK123456789',
    },
    {
      id: 2,
      status: 'processing',
      scheduledDate: '2024-07-15',
      shippedDate: '2024-07-10',
      returnedDate: '2024-07-28',
      trackingNumber: 'TRK987654321',
    },
  ]);

  const [billingHistory] = useState<BillingHistoryItem[]>([
    {
      id: 'inv-001',
      date: '2024-01-15',
      amount: 898,
      description: 'The Deep Dive - Annual Subscription',
      status: 'paid',
    },
    {
      id: 'inv-002',
      date: '2023-01-15',
      amount: 898,
      description: 'The Deep Dive - Annual Subscription',
      status: 'paid',
    },
  ]);

  const plans = {
    foundation: {
      name: 'The Foundation',
      subtitle: 'START YOUR JOURNEY',
      price: 499,
      priceLabel: '$499',
      tests: 1,
      description: 'Perfect for those ready to understand their baseline toxic burden. One comprehensive test for clarity.',
      features: [
        '300+ chemicals analyzed',
        'Comprehensive report',
        'Personalized insights',
      ],
      savings: null,
    },
    'deep-dive': {
      name: 'The Deep Dive',
      subtitle: 'TRACK YOUR PROGRESS',
      price: 898,
      priceLabel: '$898 / 2 tests',
      tests: 2,
      description: 'For health enthusiasts who want to see how lifestyle changes impact their chemical exposure over time.',
      features: [
        '300+ chemicals analyzed',
        'Progress tracking',
        'Bi-annual testing',
        'Trend analysis',
      ],
      savings: 'Save 10%',
    },
    optimizer: {
      name: 'The Optimizer',
      subtitle: 'MAXIMUM INSIGHT',
      price: 1597,
      priceLabel: '$1,597 / 4 tests',
      tests: 4,
      description: 'For those serious about optimization. Quarterly testing provides the data density needed to make informed decisions year-round.',
      features: [
        '300+ chemicals analyzed',
        'Quarterly testing',
        'Detailed trends',
        'Priority support',
        'Seasonal insights',
      ],
      savings: 'Save 20%',
      popular: true,
    },
  };

  const getKitStatusInfo = (status: TestKit['status']) => {
    switch (status) {
      case 'pending':
        return { label: 'Scheduled', icon: Calendar, color: 'text-gray-500', bgColor: 'bg-gray-100' };
      case 'shipped':
        return { label: 'Shipped', icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'in-use':
        return { label: 'In Use', icon: Package, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      case 'returned':
        return { label: 'Returned', icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-100' };
      case 'processing':
        return { label: 'Processing', icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' };
      case 'completed':
        return { label: 'Completed', icon: CheckCircle, color: 'text-[#9CBB04]', bgColor: 'bg-[#9CBB04]/10' };
      default:
        return { label: 'Unknown', icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentPlanData = plans[currentPlan];
  const nextBillingDate = new Date();
  nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  nextBillingDate.setMonth(0); // January
  nextBillingDate.setDate(15);

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription, view billing history, and track your test kits</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Subscription Plan */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full">
              <div className="px-6 py-4 bg-[#404B69]">
                <h2 className="text-lg font-semibold text-white">Current Subscription</h2>
              </div>
              <div className="p-6">
                <div className="border-2 border-[#9CBB04] rounded-lg p-6 bg-gradient-to-br from-[#9CBB04]/5 to-transparent">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs font-semibold text-[#9CBB04] uppercase tracking-wide mb-1">
                        {currentPlanData.subtitle}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{currentPlanData.name}</h3>
                      {currentPlanData.savings && (
                        <span className="inline-block bg-[#9CBB04]/20 text-[#9CBB04] text-xs font-semibold px-3 py-1 rounded-full">
                          {currentPlanData.savings}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{currentPlanData.priceLabel}</div>
                      <div className="text-sm text-gray-500">per year</div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 text-sm">{currentPlanData.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {currentPlanData.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-[#9CBB04] mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Next billing date:</span>
                      <span className="font-medium text-gray-900">{formatDate(nextBillingDate.toISOString())}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tests per year:</span>
                      <span className="font-medium text-gray-900">{currentPlanData.tests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tests remaining:</span>
                      <span className="font-medium text-gray-900">
                        {currentPlanData.tests - testKits.filter(kit => kit.status === 'completed' || kit.status === 'processing').length}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
                      Change Plan
                    </button>
                    <button className="flex-1 px-4 py-2 bg-[#9CBB04] text-white rounded-lg hover:bg-[#8AA803] transition-colors font-medium text-sm">
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment Method and Account Summary */}
          <div className="flex flex-col gap-6 h-full">
            {/* Payment Method */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
              <div className="px-6 py-4 bg-[#404B69]">
                <h2 className="text-lg font-semibold text-white">Payment Method</h2>
              </div>
              <div className="p-4">
                <div className="flex items-center mb-3">
                  <CreditCard className="w-6 h-6 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{paymentMethod.brand}</div>
                    <div className="text-xs text-gray-500">•••• •••• •••• {paymentMethod.last4}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mb-3">
                  Expires {paymentMethod.expiryMonth}/{paymentMethod.expiryYear}
                </div>
                <button className="w-full px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-xs">
                  Update Payment Method
                </button>
              </div>
            </div>

            {/* Account Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1">
              <div className="px-6 py-4 bg-[#404B69]">
                <h2 className="text-lg font-semibold text-white">Account Summary</h2>
              </div>
              <div className="p-4 space-y-3 h-full flex flex-col">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium text-gray-900">January 2023</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total tests completed</span>
                    <span className="text-sm font-medium text-gray-900">
                      {testKits.filter(kit => kit.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tests in progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {testKits.filter(kit => kit.status === 'processing' || kit.status === 'returned' || kit.status === 'in-use').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total spent</span>
                    <span className="text-sm font-medium text-gray-900">
                      ${billingHistory.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-600">Next test scheduled</span>
                    <span className="text-sm font-medium text-gray-900">
                      {testKits.find(kit => kit.status === 'pending' || kit.status === 'shipped') 
                        ? formatDate(testKits.find(kit => kit.status === 'pending' || kit.status === 'shipped')!.scheduledDate)
                        : 'Not scheduled'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm text-gray-600">Tests remaining</span>
                    <span className="text-sm font-medium text-gray-900">
                      {currentPlanData.tests - testKits.filter(kit => kit.status === 'completed' || kit.status === 'processing').length}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Bi-annual testing schedule
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-0">
                    <span className="text-sm text-gray-600">Subscription status</span>
                    <span className="text-xs font-semibold text-[#9CBB04] bg-[#9CBB04]/10 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Renewal date</span>
                    <span className="text-gray-900 font-medium">{formatDate(nextBillingDate.toISOString())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Kit Tracking */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 bg-[#404B69]">
            <h2 className="text-lg font-semibold text-white">Test Kit Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {testKits.map((kit, index) => {
                const statusInfo = getKitStatusInfo(kit.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={kit.id} className="border border-gray-200 rounded-lg p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`${statusInfo.bgColor} ${statusInfo.color} p-2 rounded-lg mr-4`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Test Kit #{kit.id}</h3>
                          <p className="text-sm text-gray-500">Scheduled for {formatDate(kit.scheduledDate)}</p>
                        </div>
                      </div>
                      <span className={`${statusInfo.bgColor} ${statusInfo.color} px-3 py-1 rounded-full text-xs font-semibold`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Timeline */}
                    <div className="ml-14 space-y-3">
                      <div className="flex items-center text-sm">
                        <div className={`w-2 h-2 rounded-full mr-3 ${kit.shippedDate ? 'bg-[#9CBB04]' : 'bg-gray-300'}`}></div>
                        <span className={kit.shippedDate ? 'text-gray-900' : 'text-gray-400'}>
                          Kit shipped {kit.shippedDate ? formatDate(kit.shippedDate) : '(pending)'}
                        </span>
                        {kit.trackingNumber && (
                          <span className="ml-2 text-xs text-[#9CBB04]">({kit.trackingNumber})</span>
                        )}
                      </div>
                      <div className="flex items-center text-sm">
                        <div className={`w-2 h-2 rounded-full mr-3 ${kit.returnedDate ? 'bg-[#9CBB04]' : 'bg-gray-300'}`}></div>
                        <span className={kit.returnedDate ? 'text-gray-900' : 'text-gray-400'}>
                          Kit returned {kit.returnedDate ? formatDate(kit.returnedDate) : '(pending)'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className={`w-2 h-2 rounded-full mr-3 ${kit.completedDate ? 'bg-[#9CBB04]' : kit.status === 'processing' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                        <span className={kit.completedDate ? 'text-gray-900' : kit.status === 'processing' ? 'text-orange-600' : 'text-gray-400'}>
                          {kit.completedDate 
                            ? `Results available ${formatDate(kit.completedDate)}`
                            : kit.status === 'processing'
                            ? 'Processing your sample...'
                            : 'Results pending'}
                        </span>
                      </div>
                    </div>

                    {kit.status === 'completed' && (
                      <div className="mt-4 ml-14">
                        <button className="text-sm text-[#9CBB04] hover:text-[#8AA803] font-medium flex items-center">
                          View Results
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {testKits.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No test kits scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 bg-[#404B69]">
            <h2 className="text-lg font-semibold text-white">Billing History</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {billingHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-4" />
                    <div>
                      <div className="font-medium text-gray-900">{item.description}</div>
                      <div className="text-sm text-gray-500">{formatDate(item.date)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${item.amount.toFixed(2)}</div>
                      <div className={`text-xs ${
                        item.status === 'paid' ? 'text-[#9CBB04]' : 
                        item.status === 'pending' ? 'text-orange-600' : 
                        'text-red-600'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-[#9CBB04] transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {billingHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No billing history available</p>
              </div>
            )}
          </div>
        </div>

        {/* Available Plans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-[#404B69]">
            <h2 className="text-lg font-semibold text-white">Available Plans</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(plans).map(([key, plan]) => {
                const isCurrentPlan = key === currentPlan;
                const isPopular = 'popular' in plan && plan.popular && !isCurrentPlan;
                
                return (
                  <div
                    key={key}
                    className={`relative rounded-lg p-6 border-2 ${
                      isCurrentPlan
                        ? 'border-[#9CBB04] bg-gradient-to-br from-[#9CBB04]/5 to-transparent'
                        : isPopular
                        ? 'border-[#404B69] bg-[#404B69] text-white'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-[#9CBB04] text-white text-xs font-semibold px-3 py-1 rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                        isCurrentPlan ? 'text-[#9CBB04]' : isPopular ? 'text-yellow-400' : 'text-gray-500'
                      }`}>
                        {plan.subtitle}
                      </div>
                      <h3 className={`text-xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                        {plan.name}
                      </h3>
                      {plan.savings && (
                        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                          isPopular 
                            ? 'bg-[#9CBB04]/20 text-[#9CBB04]' 
                            : 'bg-[#9CBB04]/20 text-[#9CBB04]'
                        }`}>
                          {plan.savings}
                        </span>
                      )}
                    </div>
                    
                    <div className={`text-2xl font-bold mb-4 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                      {plan.priceLabel}
                    </div>
                    
                    <p className={`text-sm mb-4 ${isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                      {plan.description}
                    </p>
                    
                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <Check className={`w-4 h-4 mr-2 flex-shrink-0 ${
                            isPopular ? 'text-[#9CBB04]' : 'text-[#9CBB04]'
                          }`} />
                          <span className={isPopular ? 'text-gray-200' : 'text-gray-700'}>{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                        isCurrentPlan
                          ? 'bg-white border-2 border-[#9CBB04] text-[#9CBB04] hover:bg-[#9CBB04]/5'
                          : isPopular
                          ? 'bg-[#9CBB04] text-white hover:bg-[#8AA803]'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
