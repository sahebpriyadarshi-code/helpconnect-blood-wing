
import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, Droplet, Heart, Activity } from 'lucide-react';
import { useGetDonorRequests, useRefreshRequests, useCancelRequest, useDiscardRequest, BloodRequest } from '../hooks/useRequests';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { motion, AnimatePresence } from 'framer-motion';

import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription';

export default function StatusTrackingPage() {
  const { identity } = useInternetIdentity();

  // DEBUGGING STATE
  const [debugInfo, setDebugInfo] = useState<string>('');

  // Realtime subscription
  useRealtimeSubscription({ userId: identity?.getPrincipal().toString(), enabled: !!identity });

  // Fetch requests with real-time updates
  const {
    data: requests,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useGetDonorRequests();

  const refreshRequests = useRefreshRequests(identity?.getPrincipal().toString() || '');
  const cancelRequest = useCancelRequest();
  const discardRequest = useDiscardRequest();

  const handleRefresh = () => {
    refreshRequests();
  };

  const handleCancelRequest = async (requestId: string) => {
    if (confirm('Are you sure you want to cancel this request?')) {
      await cancelRequest.mutateAsync(requestId);
    }
  };

  const handleDiscardRequest = async (requestId: string) => {
    if (confirm('Are you sure you want to discard this request?')) {
      await discardRequest.mutateAsync(requestId);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: BloodRequest['status'] }) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      searching: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      matched: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      fulfilled: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      discarded: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Urgency badge component
  const UrgencyBadge = ({ urgency }: { urgency: BloodRequest['urgency'] }) => {
    const urgencyConfig = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${urgencyConfig[urgency]}`}>
        {urgency.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Error Loading Requests</h2>
          <p className="text-gray-600 mt-2">{error?.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      {/* Background Graffiti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 dark:opacity-5 -z-10">
        <Droplet className="absolute top-0 right-[5%] w-32 h-32 text-rose-600 rotate-12" />
        <Activity className="absolute top-40 left-[2%] w-24 h-24 text-rose-600 -rotate-12" />
        <Heart className="absolute bottom-20 right-[10%] w-40 h-40 text-rose-600 rotate-6" />
        <div className="absolute top-20 left-[15%] text-9xl font-black text-rose-600 opacity-20 select-none hidden lg:block">A+</div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
            My <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-rose-600">Requests</span>
          </h1>
          <p className="text-muted-foreground text-lg">Track your blood donation requests in real-time</p>
          <div className="mt-2 text-xs text-muted-foreground bg-accent/50 p-2 rounded border border-border font-mono hidden">
            DEBUG: ID={identity?.getPrincipal().toString().slice(0, 8)}... |
            Count={requests?.length || 0} |
            Status={isFetching ? 'Fetching' : 'Idle'}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isFetching}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-rose-600 to-orange-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Requests List */}
      {!requests || requests.length === 0 ? (
        <div className="text-center py-16 bg-white/50 dark:bg-card/50 backdrop-blur-md rounded-2xl border border-dashed border-rose-200">
          <AlertCircle className="w-16 h-16 text-rose-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Requests Yet</h3>
          <p className="text-muted-foreground mb-6">You haven't created any blood requests</p>
          <a
            href="/request-blood"
            className="inline-flex items-center px-8 py-3 bg-rose-600 text-white rounded-full font-bold shadow-md hover:bg-rose-700 transition-colors"
          >
            Create New Request
          </a>
        </div>
      ) : (
        <div className="grid gap-6 relative z-10">
          <AnimatePresence mode="popLayout">
            {requests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <TrackingCard
                  request={request}
                  onDiscard={handleDiscardRequest}
                  isDiscardPending={discardRequest.isPending}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Auto-refresh indicator */}
      {isFetching && (
        <div className="fixed bottom-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-lg rounded-full px-4 py-2 flex items-center space-x-2 border border-rose-100 z-50">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
          <span className="text-sm font-medium text-rose-600">Syncing...</span>
        </div>
      )}
    </div>
  );
}

function TrackingCard({
  request,
  onDiscard,
  isDiscardPending
}: {
  request: BloodRequest;
  onDiscard: (id: string) => void;
  isDiscardPending: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Status badge component
  const StatusBadge = ({ status }: { status: BloodRequest['status'] }) => {
    const statusConfig: any = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      searching: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      matched: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      fulfilled: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      discarded: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Urgency badge component
  const UrgencyBadge = ({ urgency }: { urgency: BloodRequest['urgency'] }) => {
    const urgencyConfig: any = {
      critical: 'bg-red-100 text-red-800 border-red-300',
      high: 'bg-orange-100 text-orange-800 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${urgencyConfig[urgency] || urgencyConfig.medium}`}>
        {(urgency || 'medium').toUpperCase()}
      </span>
    );
  };

  return (
    <div
      className="bg-white/70 dark:bg-card/70 backdrop-blur-md rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900/40 overflow-hidden hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 group"
    >
      <div className="p-6">
        {/* Request Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl">
                {request.blood_type}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {request.recipient_name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <UrgencyBadge urgency={request.urgency} />
            <StatusBadge status={request.status} />
            <button
              className="p-2 hover:bg-accent rounded-full transition-colors"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Request Details */}
            <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-dashed border-rose-100/50">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Units Needed</p>
                <p className="font-bold text-foreground text-lg">{request.units_needed} units</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hospital</p>
                <p className="font-medium text-foreground">{request.hospital_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
                <p className="font-medium text-foreground">{request.recipient_phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
                <p className="font-medium text-foreground text-sm">{request.hospital_address}</p>
              </div>
            </div>

            {/* Reason */}
            <div className="mb-6 bg-accent/30 p-4 rounded-xl">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
              <p className="text-foreground italic">"{request.reason}"</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              {request.status === 'discarded' ? (
                <button
                  disabled
                  className="px-5 py-2.5 bg-muted text-muted-foreground rounded-xl cursor-not-allowed border border-border font-medium"
                >
                  Discarded
                </button>
              ) : (
                <button
                  onClick={() => onDiscard(request.id)}
                  disabled={isDiscardPending}
                  className="px-5 py-2.5 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 font-bold transition-all disabled:opacity-50"
                >
                  Discard Request
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
