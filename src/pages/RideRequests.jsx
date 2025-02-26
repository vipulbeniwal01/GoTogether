import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ExclamationCircleIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export default function RideRequests() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's ride requests
  useEffect(() => {
    fetchRideRequests();
    
    // Force an immediate refresh after a short delay to get the most up-to-date status
    const initialRefreshTimeout = setTimeout(() => {
      refreshRideRequests();
    }, 3000);
    
    // Set up automatic refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      refreshRideRequests();
    }, 30000);
    
    return () => {
      clearInterval(refreshInterval);
      clearTimeout(initialRefreshTimeout);
    };
  }, [user]);
  
  // Apply filters when requests or statusFilter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRequests(requests);
    } else {
      setFilteredRequests(requests.filter(request => request.status === statusFilter));
    }
  }, [requests, statusFilter]);

  const fetchRideRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all rides the user has requested to join
      const response = await ridesApi.getUserRequests();
      console.log('User ride requests API response:', response);
      
      let userRequests = [];
      if (response.data && response.data.data) {
        userRequests = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        userRequests = response.data;
      } else if (response.data) {
        userRequests = [response.data];
      }
      
      // Log the entire response to debug what we're getting from the API
      console.log('Complete user request response:', JSON.stringify(response.data));
      
      // Process each request to ensure status is correctly set
      const processedRequests = userRequests.map(request => {
        // Debug the structure of each request
        console.log('Processing request:', request.id || request._id, {
          directStatus: request.status,
          userRequestStatus: request.userRequestStatus,
          passengerInfo: request.passengers?.find(p => 
            (p.user === user.id) || 
            (p.user?._id === user.id) || 
            (p.user?.id === user.id)
          )
        });
        
        // Check for explicit userRequestStatus from the API (most reliable)
        if (request.userRequestStatus) {
          console.log(`Found userRequestStatus in API response: ${request.userRequestStatus}`);
          return {
            ...request,
            status: request.userRequestStatus
          };
        }
        
        // Check direct status if set to something other than pending
        if (request.status && request.status !== 'pending') {
          console.log(`Found direct status on request: ${request.status}`);
          return request;
        }
        
        // Check for the user's status in the passengers array
        if (request.passengers && Array.isArray(request.passengers)) {
          const userPassenger = request.passengers.find(p => {
            // Try different ways to match the user
            const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
            return passengerId === user.id || passengerId === user._id;
          });
          
          if (userPassenger && userPassenger.status) {
            console.log(`Found user status in passengers array: ${userPassenger.status}`);
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // Check in ride's passenger array (nested structure)
        if (request.ride && request.ride.passengers && Array.isArray(request.ride.passengers)) {
          const userPassenger = request.ride.passengers.find(
            p => (p.user === user.id || 
                 (p.user && p.user.id === user.id) || 
                 (p.user && p.user._id === user.id))
          );
          
          if (userPassenger && userPassenger.status) {
            console.log(`Found user status in ride.passengers array: ${userPassenger.status}`);
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // If we still haven't found a status, make a direct API call for this specific ride
        // to get the most up-to-date status
        if (request.ride && (request.ride.id || request.ride._id)) {
          const rideId = request.ride.id || request.ride._id;
          console.log(`Making direct call to get status for ride: ${rideId}`);
          
          // We can't make the direct API call here since we're in a map function
          // Instead, mark it for refresh after this batch is processed
          setTimeout(() => {
            refreshSingleRideStatus(rideId);
          }, 100);
        }
        
        // Default to pending if no status found
        console.log('No definitive status found, defaulting to pending');
        return {
          ...request,
          status: 'pending'
        };
      });
      
      // Sort by most recent first
      processedRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.departureTime || a.time || 0);
        const dateB = new Date(b.createdAt || b.departureTime || b.time || 0);
        return dateB - dateA;
      });
      
      setRequests(processedRequests);
      
    } catch (error) {
      console.error('Failed to fetch ride requests:', error);
      let errorMessage = 'Failed to load your ride requests.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 'Server error. Please try again.';
        
        if (error.response.status === 401) {
          navigate('/login');
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh a single ride's status via direct API call
  const refreshSingleRideStatus = async (rideId) => {
    if (!rideId || refreshing || loading) return;
    
    try {
      console.log(`Refreshing single ride status for ride: ${rideId}`);
      const response = await ridesApi.getRideById(rideId);
      
      if (response.data && (response.data.data || response.data)) {
        const rideDetails = response.data.data || response.data;
        
        // Find the user in the passengers array
        if (rideDetails.passengers && Array.isArray(rideDetails.passengers)) {
          const userPassenger = rideDetails.passengers.find(p => {
            const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
            return passengerId === user.id || passengerId === user._id;
          });
          
          if (userPassenger && userPassenger.status) {
            console.log(`Found updated status for ride ${rideId}: ${userPassenger.status}`);
            
            // Update the requests state
            setRequests(prevRequests => {
              return prevRequests.map(req => {
                if ((req.ride?.id === rideId || req.ride?._id === rideId || req.id === rideId || req._id === rideId) && req.status !== userPassenger.status) {
                  toast.success(`Ride request status updated to ${userPassenger.status}`);
                  return { ...req, status: userPassenger.status };
                }
                return req;
              });
            });
          }
        }
      }
    } catch (error) {
      console.error(`Failed to refresh status for ride ${rideId}:`, error);
    }
  };

  // Refresh ride requests data silently (without loading indicator)
  const refreshRideRequests = async () => {
    if (!user || loading) return;
    
    try {
      setRefreshing(true);
      
      const response = await ridesApi.getUserRequests();
      console.log('Refreshed ride requests:', response);
      
      let userRequests = [];
      if (response.data && response.data.data) {
        userRequests = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        userRequests = response.data;
      } else if (response.data) {
        userRequests = [response.data];
      }
      
      // Process each request with the same enhanced logic
      const processedRequests = userRequests.map(request => {
        // Check for explicit userRequestStatus from the API (most reliable)
        if (request.userRequestStatus) {
          return {
            ...request,
            status: request.userRequestStatus
          };
        }
        
        // Check direct status if set to something other than pending
        if (request.status && request.status !== 'pending') {
          return request;
        }
        
        // Check for the user's status in the passengers array
        if (request.passengers && Array.isArray(request.passengers)) {
          const userPassenger = request.passengers.find(p => {
            // Try different ways to match the user
            const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
            return passengerId === user.id || passengerId === user._id;
          });
          
          if (userPassenger && userPassenger.status) {
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // Check in ride's passenger array (nested structure)
        if (request.ride && request.ride.passengers && Array.isArray(request.ride.passengers)) {
          const userPassenger = request.ride.passengers.find(
            p => (p.user === user.id || 
                 (p.user && p.user.id === user.id) || 
                 (p.user && p.user._id === user.id))
          );
          
          if (userPassenger && userPassenger.status) {
            return {
              ...request,
              status: userPassenger.status
            };
          }
        }
        
        // Schedule a targeted refresh for this ride
        if (request.ride && (request.ride.id || request.ride._id)) {
          const rideId = request.ride.id || request.ride._id;
          setTimeout(() => {
            refreshSingleRideStatus(rideId);
          }, 100);
        }
        
        // Default to pending if no status found
        return {
          ...request,
          status: 'pending'
        };
      });
      
      // Sort by most recent first
      processedRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.departureTime || a.time || 0);
        const dateB = new Date(b.createdAt || b.departureTime || b.time || 0);
        return dateB - dateA;
      });
      
      // Check if there are any status changes before updating
      const hasStatusChanges = JSON.stringify(processedRequests.map(r => ({
        id: r.id || r._id,
        status: r.status
      }))) !== JSON.stringify(requests.map(r => ({
        id: r.id || r._id,
        status: r.status
      })));
      
      if (hasStatusChanges) {
        setRequests(processedRequests);
        toast.success('Ride request status updated');
      } else {
        // No changes detected, just update the state without notification
        setRequests(processedRequests);
      }
      
    } catch (error) {
      console.error('Failed to refresh ride requests:', error);
      // Don't show error toast on silent refresh
    } finally {
      setRefreshing(false);
    }
  };

  // Handle canceling a ride request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this ride request?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await ridesApi.cancelRequest(requestId);
      
      toast.success('Ride request cancelled successfully');
      
      // Update local state to remove the cancelled request
      setRequests(prevRequests => 
        prevRequests.filter(req => (req.id || req._id) !== requestId)
      );
    } catch (error) {
      console.error('Failed to cancel ride request:', error);
      
      let errorMessage = 'Failed to cancel ride request.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      // Format: "Mar 30, 2024 at 10:00 AM"
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'No date';
    }
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };
  
  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch(status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case 'cancelled':
        return <XMarkIcon className="h-5 w-5 text-gray-600" />;
      case 'pending':
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };
  
  // Format status text for display
  const formatStatusText = (status) => {
    switch(status) {
      case 'confirmed':
        return 'Confirmed';
      case 'rejected':
        return 'Rejected';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  // Get driver name from ride
  const getDriverName = (ride) => {
    if (!ride) return 'Unknown Driver';
    
    if (ride.creator) {
      if (typeof ride.creator === 'string') {
        return 'Driver';
      } else if (ride.creator.firstName && ride.creator.lastName) {
        return `${ride.creator.firstName} ${ride.creator.lastName}`;
      } else if (ride.creator.name) {
        return ride.creator.name;
      } else if (ride.creator.username) {
        return ride.creator.username;
      }
    } else if (ride.driver) {
      if (typeof ride.driver === 'string') {
        return 'Driver';
      } else if (ride.driver.firstName && ride.driver.lastName) {
        return `${ride.driver.firstName} ${ride.driver.lastName}`;
      } else if (ride.driver.name) {
        return ride.driver.name;
      } else if (ride.driver.username) {
        return ride.driver.username;
      }
    }
    
    return 'Driver';
  };

  // Get location string
  const getLocationString = (location) => {
    if (!location) return 'N/A';
    
    // First priority: Check if there's an address
    if (location.address) {
      return location.address;
    }
    
    // Second priority: Check if there's a name
    if (location.name) {
      return location.name;
    }
    
    // Third priority: Check for coordinates
    if (location.coordinates && Array.isArray(location.coordinates)) {
      // Don't display raw coordinates to the user, show a more friendly message
      return 'Location coordinates available';
    }
    
    // Fourth priority: If location is just a string
    if (typeof location === 'string') {
      return location;
    }
    
    return 'N/A';
  };

  // Force refresh all ride statuses by directly checking each ride
  const forceRefreshAllStatuses = async () => {
    if (!user || refreshing || loading || requests.length === 0) return;
    
    try {
      setRefreshing(true);
      toast.loading('Checking latest status for all rides...');
      
      // Create a copy of the requests to update
      const updatedRequests = [...requests];
      let statusChanged = false;
      
      // Process each ride with a direct API call to get current status
      for (let i = 0; i < updatedRequests.length; i++) {
        const request = updatedRequests[i];
        const rideId = request.ride?.id || request.ride?._id || request.id || request._id;
        
        if (rideId) {
          try {
            const response = await ridesApi.getRideById(rideId);
            const rideDetails = response.data.data || response.data;
            
            if (rideDetails && rideDetails.passengers && Array.isArray(rideDetails.passengers)) {
              const userPassenger = rideDetails.passengers.find(p => {
                const passengerId = typeof p.user === 'string' ? p.user : (p.user?.id || p.user?._id);
                return passengerId === user.id || passengerId === user._id;
              });
              
              if (userPassenger && userPassenger.status && userPassenger.status !== request.status) {
                console.log(`Status updated for ride ${rideId}: ${request.status} → ${userPassenger.status}`);
                updatedRequests[i] = {
                  ...request,
                  status: userPassenger.status
                };
                statusChanged = true;
              }
            }
          } catch (error) {
            console.error(`Error checking ride ${rideId}:`, error);
          }
        }
      }
      
      // Update state if any statuses changed
      if (statusChanged) {
        setRequests(updatedRequests);
        toast.success('Ride statuses updated successfully');
      } else {
        toast.success('All ride statuses are already up to date');
      }
      
    } catch (error) {
      console.error('Error in force refresh:', error);
      toast.error('Failed to refresh ride statuses');
    } finally {
      setRefreshing(false);
      toast.dismiss();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">My Ride Requests</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your ride requests
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Loading your ride requests...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-2 text-red-500">{error}</p>
          <button 
            onClick={fetchRideRequests}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">You haven't made any ride requests yet.</p>
          <button 
            onClick={() => navigate('/rides')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Find Rides
          </button>
        </div>
      ) : (
        <div>
          {/* Status filter buttons and refresh button */}
          <div className="px-6 py-4 flex flex-wrap items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Requests
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                <ClockIcon className="h-4 w-4" />
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`px-4 py-2 flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                <CheckCircleIcon className="h-4 w-4" />
                Confirmed
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-4 py-2 flex items-center gap-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <XCircleIcon className="h-4 w-4" />
                Rejected
              </button>
            </div>
            
            <button
              onClick={refreshRideRequests}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium hover:bg-primary/20 transition-colors"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={forceRefreshAllStatuses}
              disabled={refreshing || loading || requests.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors ml-2"
              title="Force check latest status from server for all rides"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Force Update Status
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ride Details
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seats
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => {
                  const requestId = request.id || request._id;
                  const ride = request.ride || request;
                  const rideId = ride.id || ride._id;
                  const status = request.status || 'pending';
                  
                  // Get ride details
                  const departureTime = formatDate(ride.departureTime || ride.time);
                  const driverName = getDriverName(ride);
                  const seats = ride.availableSeats || ride.seatsAvailable || 0;
                  const price = ride.price?.toFixed(2) || '0.00';
                  
                  // Get location details
                  const pickup = getLocationString(ride.pickupLocation);
                  const dropoff = getLocationString(ride.dropoffLocation);
                  
                  // Get status description
                  const getStatusDescription = () => {
                    switch(status) {
                      case 'confirmed':
                        return 'Your ride request has been approved by the driver.';
                      case 'rejected':
                        return 'Your ride request was declined by the driver.';
                      case 'cancelled':
                        return 'This ride request has been cancelled.';
                      case 'pending':
                      default:
                        return 'Waiting for driver approval.';
                    }
                  };
                  
                  return (
                    <tr key={requestId} className={`hover:bg-gray-50 ${
                      status === 'confirmed' ? 'bg-green-50/30' : 
                      status === 'rejected' ? 'bg-red-50/30' : 
                      status === 'cancelled' ? 'bg-gray-50/50' : 
                      ''
                    }`}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{departureTime}</div>
                        <div className="text-sm text-gray-500">{pickup} → {dropoff}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md border ${getStatusBadgeClass(status)}`}>
                            {getStatusIcon(status)}
                            {formatStatusText(status)}
                          </span>
                          <p className="mt-1 text-xs text-gray-500">{getStatusDescription()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{driverName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {seats}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        ${price}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => navigate(`/rides/${rideId}`)}
                            className="text-primary hover:text-primary/80"
                          >
                            View
                          </button>
                          
                          {status === 'pending' && (
                            <button
                              onClick={() => handleCancelRequest(request.id || request._id)}
                              disabled={actionLoading}
                              className="text-red-600 hover:text-red-800 flex items-center"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredRequests.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No {statusFilter !== 'all' ? statusFilter : ''} requests found.</p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-2 text-primary hover:text-primary/80"
                >
                  Show all requests
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 