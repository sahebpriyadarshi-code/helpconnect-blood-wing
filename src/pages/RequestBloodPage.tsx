
import React, { useState, useEffect } from 'react';
import { useCreateBloodRequest } from '../hooks/useRequests';
import { AlertCircle, CheckCircle, Loader2, Droplet, Heart, Activity } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface RequestFormData {
  recipient_name: string;
  recipient_phone: string;
  blood_type: string;
  units_needed: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  hospital_name: string;
  hospital_address: string;
  state: string;
  reason: string;
}

export default function RequestBloodPage() {
  const { identity } = useInternetIdentity();
  const [donorId, setDonorId] = useState<string>('');
  const createRequest = useCreateBloodRequest();

  useEffect(() => {
    if (identity) {
      // Use email as donorID as established in previous steps
      setDonorId(identity.getPrincipal().toString());
    }
  }, [identity]);

  const [formData, setFormData] = useState<RequestFormData>({
    recipient_name: '',
    recipient_phone: '',
    blood_type: 'O+',
    units_needed: 1,
    urgency: 'medium',
    hospital_name: '',
    hospital_address: '',
    state: '',
    reason: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RequestFormData, string>> = {};

    if (!formData.recipient_name.trim()) {
      newErrors.recipient_name = 'Recipient name is required';
    }

    if (!formData.recipient_phone.trim()) {
      newErrors.recipient_phone = 'Contact phone is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.recipient_phone)) {
      newErrors.recipient_phone = 'Invalid phone number format';
    }

    if (!formData.hospital_name.trim()) {
      newErrors.hospital_name = 'Hospital name is required';
    }

    if (!formData.hospital_address.trim()) {
      newErrors.hospital_address = 'Hospital address is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Reason for request is required';
    }

    if (formData.units_needed < 1 || formData.units_needed > 10) {
      newErrors.units_needed = 'Units needed must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'units_needed' ? parseInt(value) || 1 : value,
    }));
    // Clear error for this field
    if (errors[name as keyof RequestFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!donorId) {
      // Fallback or error if no identity
      return;
    }

    try {
      await createRequest.mutateAsync({
        ...formData,
      });

      // Reset form
      setFormData({
        recipient_name: '',
        recipient_phone: '',
        blood_type: 'O+',
        units_needed: 1,
        urgency: 'medium',
        hospital_name: '',
        hospital_address: '',
        state: '',
        reason: '',
      });

      // Redirect to status page after 2 seconds
      setTimeout(() => {
        window.location.href = '/status-tracking'; // Adjusted path to match existing route
      }, 2000);
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl relative">
      {/* Background Graffiti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 dark:opacity-5 -z-10">
        <Droplet className="absolute top-0 right-[5%] w-32 h-32 text-rose-600 rotate-12" />
        <Activity className="absolute top-40 left-[2%] w-24 h-24 text-rose-600 -rotate-12" />
        <Heart className="absolute bottom-20 right-[10%] w-40 h-40 text-rose-600 rotate-6" />
        <div className="absolute top-20 left-[15%] text-9xl font-black text-rose-600 opacity-20 select-none hidden lg:block">B+</div>
      </div>

      <div className="bg-white/80 dark:bg-card/80 backdrop-blur-md rounded-2xl shadow-xl border border-rose-100 dark:border-rose-900/30 p-8 relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-foreground mb-3 tracking-tight">Request <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-600">Blood</span></h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Fill out this form to request blood donation. Our system will automatically find compatible donors.
          </p>
        </div>

        {/* Success Message */}
        {createRequest.isSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900">Request Created Successfully!</h3>
              <p className="text-green-700 text-sm mt-1">
                Your blood request has been created and is now being processed. Redirecting to tracking...
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipient Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  id="recipient_name"
                  name="recipient_name"
                  value={formData.recipient_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.recipient_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter recipient name"
                />
                {errors.recipient_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.recipient_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="recipient_phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  id="recipient_phone"
                  name="recipient_phone"
                  value={formData.recipient_phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.recipient_phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="+91 1234567890"
                />
                {errors.recipient_phone && (
                  <p className="text-red-600 text-sm mt-1">{errors.recipient_phone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Blood Request Details */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Blood Request Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="blood_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type *
                </label>
                <select
                  id="blood_type"
                  name="blood_type"
                  value={formData.blood_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label htmlFor="units_needed" className="block text-sm font-medium text-gray-700 mb-2">
                  Units Needed *
                </label>
                <input
                  type="number"
                  id="units_needed"
                  name="units_needed"
                  min="1"
                  max="10"
                  value={formData.units_needed}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.units_needed ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.units_needed && (
                  <p className="text-red-600 text-sm mt-1">{errors.units_needed}</p>
                )}
              </div>

              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency Level *
                </label>
                <select
                  id="urgency"
                  name="urgency"
                  value={formData.urgency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hospital Information */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hospital Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="hospital_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  id="hospital_name"
                  name="hospital_name"
                  value={formData.hospital_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.hospital_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter hospital name"
                />
                {errors.hospital_name && (
                  <p className="text-red-600 text-sm mt-1">{errors.hospital_name}</p>
                )}
              </div>

              <div>
                <label htmlFor="hospital_address" className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Address *
                </label>
                <input
                  type="text"
                  id="hospital_address"
                  name="hospital_address"
                  value={formData.hospital_address}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.hospital_address ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter complete hospital address"
                />
                {errors.hospital_address && (
                  <p className="text-red-600 text-sm mt-1">{errors.hospital_address}</p>
                )}
              </div>
            </div>
          </div>

          {/* State Information */}
          <div className="border-b border-gray-200 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter state"
                />
                {errors.state && (
                  <p className="text-red-600 text-sm mt-1">{errors.state}</p>
                )}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Request *
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={4}
              value={formData.reason}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.reason ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Please provide details about why blood is needed..."
            />
            {errors.reason && (
              <p className="text-red-600 text-sm mt-1">{errors.reason}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createRequest.isPending}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
