"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { businessPoints, BusinessPoint, getPhotoUrl } from "@/lib/businessData";
import { useBusinessPhotos } from "@/hooks/useImagePreloader";
import { Heart, Trash2, MapPin, ArrowLeft, Star, Phone, Navigation, Route, Play, GripVertical, X, Plus, Sparkles, Clock, Car, ChevronDown, RotateCcw, Edit2, Check } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useSession, signIn } from "next-auth/react";
import { logDebug, logError, logInfo } from "@/lib/logger";

// Types for route planning
type TripStop = {
  id: string;
  business: BusinessPoint;
  townId: string;
  townName: string;
  order: number;
  duration?: number; // minutes to spend
};

type RouteInfo = {
  distance: number; // km
  duration: number; // minutes
  geometry?: GeoJSON.LineString;
};

type SavedTrip = {
  id: string;
  name: string;
  startLocation: { name: string; coords: [number, number] } | null;
  endLocation: { name: string; coords: [number, number] } | null;
  hasEndPoint: boolean;
  stops: TripStop[];
  routeInfo: RouteInfo | null;
  totalTime: number;
  createdAt: string;
};

// Garden Route common locations for start/end
const commonLocations = [
  { name: "George Airport", coords: [22.3789, -34.0056] as [number, number] },
  { name: "Knysna Town Centre", coords: [23.0486, -34.0363] as [number, number] },
  { name: "Plettenberg Bay", coords: [23.3716, -34.0527] as [number, number] },
  { name: "Mossel Bay", coords: [22.1265, -34.1826] as [number, number] },
  { name: "Wilderness Beach", coords: [22.5776, -33.9937] as [number, number] },
  { name: "Oudtshoorn", coords: [22.2034, -33.5920] as [number, number] },
];

export default function MyTripPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { favorites, clearFavorites, parseFavoriteId, isLoaded, toggleFavorite, isFavorite } = useFavorites();
  
  // Route planner state
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [startLocation, setStartLocation] = useState<{ name: string; coords: [number, number] } | null>(null);
  const [endLocation, setEndLocation] = useState<{ name: string; coords: [number, number] } | null>(null);
  const [hasEndPoint, setHasEndPoint] = useState(true);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showStartDropdown, setShowStartDropdown] = useState(false);
  const [showEndDropdown, setShowEndDropdown] = useState(false);
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [showAddStop, setShowAddStop] = useState(false);
  const [stopSearchQuery, setStopSearchQuery] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Trip title and saved trips state
  const [tripTitle, setTripTitle] = useState('');
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editingTripName, setEditingTripName] = useState('');
  
  // Load saved trips from localStorage or API
  useEffect(() => {
    const loadTrips = async () => {
      if (typeof window === 'undefined') return;

      let localTrips: SavedTrip[] = [];
      const stored = localStorage.getItem('savedTrips');
      if (stored) {
        try {
          localTrips = JSON.parse(stored);
        } catch {
          localTrips = [];
        }
      }

      if (session?.user) {
        try {
          // Fetch from Supabase
          const response = await fetch('/api/user/trips');
          if (response.ok) {
            const { trips: dbTrips } = await response.json();
            
            // Convert DB trips to SavedTrip format if necessary
            const formattedDbTrips = dbTrips.map((t: any) => ({
              id: t.id,
              name: t.name,
              stops: t.stops,
              // Add other fields with defaults if missing
              startLocation: t.start_location || null,
              endLocation: t.end_location || null,
              hasEndPoint: t.has_end_point ?? true,
              routeInfo: t.route_info || null,
              totalTime: t.total_time || 0,
              createdAt: t.created_at || new Date().toISOString(),
            }));

            // Merge (prefer DB for now, or you could do more complex merging)
            setSavedTrips(formattedDbTrips);
            
            // If we have local trips, sync them to DB
            if (localTrips.length > 0) {
              logInfo("Syncing local trips to database...");
              await fetch('/api/user/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  action: 'sync', 
                  trips: localTrips 
                }),
              });
              // Clear local after sync
              localStorage.removeItem('savedTrips');
            }
          }
        } catch (error) {
          logError('Failed to sync trips with database:', error);
          setSavedTrips(localTrips);
        }
      } else {
        setSavedTrips(localTrips);
      }
    };

    if (isLoaded) {
      loadTrips();
    }
  }, [session, isLoaded]);
  
  // Map ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  
  // Get all businesses for adding stops
  const allBusinesses = useMemo(() => {
    const results: { business: BusinessPoint; townId: string; townName: string }[] = [];
    Object.entries(businessPoints).forEach(([townId, businesses]) => {
      businesses.forEach(business => {
        results.push({
          business,
          townId,
          townName: townId.charAt(0).toUpperCase() + townId.slice(1)
        });
      });
    });
    return results;
  }, []);
  
  // Filter businesses for stop search
  const filteredBusinessesForStops = useMemo(() => {
    if (!stopSearchQuery.trim()) return allBusinesses.slice(0, 10);
    const query = stopSearchQuery.toLowerCase();
    return allBusinesses
      .filter(({ business }) => 
        business.name.toLowerCase().includes(query) ||
        business.category.toLowerCase().includes(query) ||
        business.subcategory?.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [allBusinesses, stopSearchQuery]);
  
  // Filter common locations based on search
  const filteredStartLocations = useMemo(() => {
    if (!startSearchQuery.trim()) return commonLocations;
    const query = startSearchQuery.toLowerCase();
    return commonLocations.filter(loc => loc.name.toLowerCase().includes(query));
  }, [startSearchQuery]);
  
  const filteredEndLocations = useMemo(() => {
    if (!endSearchQuery.trim()) return commonLocations;
    const query = endSearchQuery.toLowerCase();
    return commonLocations.filter(loc => loc.name.toLowerCase().includes(query));
  }, [endSearchQuery]);

  // Get all favorite businesses with their town info
  const favoriteBusinesses = useMemo(() => {
    if (!isLoaded) return [];
    
    const results: { business: BusinessPoint; townId: string; townName: string }[] = [];
    
    for (const favoriteId of favorites) {
      const { townId, businessName } = parseFavoriteId(favoriteId);
      const townBusinesses = businessPoints[townId];
      
      if (townBusinesses) {
        const business = townBusinesses.find(b => b.name === businessName);
        if (business) {
          results.push({
            business,
            townId,
            townName: townId.charAt(0).toUpperCase() + townId.slice(1)
          });
        }
      }
    }
    
    return results;
  }, [favorites, parseFavoriteId, isLoaded]);

  // Navigate to map with business selected
  const handleViewOnMap = (townId: string, businessName: string) => {
    sessionStorage.setItem('selectedBusiness', JSON.stringify({ townId, businessName }));
    router.push('/');
  };

  // Initialize trip stops from favorites
  const initializeTripStops = useCallback(() => {
    const stops: TripStop[] = favoriteBusinesses.map((fav, index) => ({
      id: `${fav.townId}:${fav.business.name}`,
      business: fav.business,
      townId: fav.townId,
      townName: fav.townName,
      order: index,
      duration: 60, // Default 1 hour per stop
    }));
    setTripStops(stops);
  }, [favoriteBusinesses]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
    const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1[1] * Math.PI / 180) * Math.cos(coord2[1] * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // AI Route Optimization - nearest neighbor algorithm with start/end constraints
  const optimizeRoute = useCallback(async () => {
    if (tripStops.length < 2) return;
    
    setIsOptimizing(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const stops = [...tripStops];
    const optimized: TripStop[] = [];
    const remaining = new Set(stops.map((_, i) => i));
    
    // Start from the location closest to start point, or first stop
    let currentCoord: [number, number] = startLocation?.coords || stops[0].business.coords;
    
    // Find nearest to start
    let nearestIdx = 0;
    let nearestDist = Infinity;
    remaining.forEach(idx => {
      const dist = calculateDistance(currentCoord, stops[idx].business.coords);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = idx;
      }
    });
    
    optimized.push({ ...stops[nearestIdx], order: 0 });
    remaining.delete(nearestIdx);
    currentCoord = stops[nearestIdx].business.coords;
    
    // Greedy nearest neighbor for middle stops
    while (remaining.size > 1) {
      nearestIdx = -1;
      nearestDist = Infinity;
      remaining.forEach(idx => {
        const dist = calculateDistance(currentCoord, stops[idx].business.coords);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = idx;
        }
      });
      
      if (nearestIdx !== -1) {
        optimized.push({ ...stops[nearestIdx], order: optimized.length });
        remaining.delete(nearestIdx);
        currentCoord = stops[nearestIdx].business.coords;
      }
    }
    
    // Add last remaining stop (closest to end if specified)
    if (remaining.size === 1) {
      const lastIdx = Array.from(remaining)[0];
      optimized.push({ ...stops[lastIdx], order: optimized.length });
    }
    
    setTripStops(optimized);
    setIsOptimizing(false);
  }, [tripStops, startLocation]);

  // Fetch route from Mapbox Directions API
  const fetchRoute = useCallback(async () => {
    if (tripStops.length < 1) return;
    if (!mapRef.current || !mapLoaded) return;
    
    const coordinates: [number, number][] = [];
    
    if (startLocation) {
      coordinates.push(startLocation.coords);
    }
    
    tripStops.forEach(stop => {
      coordinates.push(stop.business.coords);
    });
    
    if (hasEndPoint && endLocation) {
      coordinates.push(endLocation.coords);
    }
    
    if (coordinates.length < 2) return;
    
    const coordString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${token}`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setRouteInfo({
          distance: route.distance / 1000,
          duration: route.duration / 60,
          geometry: route.geometry,
        });
        
        // Draw route on map - only if map is loaded
        const map = mapRef.current;
        if (!map) return;
        
        try {
          if (map.getSource('route')) {
            (map.getSource('route') as mapboxgl.GeoJSONSource).setData({
              type: 'Feature',
              properties: {},
              geometry: route.geometry,
            });
          } else if (map.isStyleLoaded()) {
            map.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry,
              },
            });
            
            map.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#38bdf8',
                'line-width': 5,
                'line-opacity': 0.9,
              },
            });
          }
        } catch {
          logDebug('Route layer already exists or map not ready');
        }
      }
    } catch (error) {
      logError('Failed to fetch route:', error);
    }
  }, [tripStops, startLocation, endLocation, hasEndPoint, mapLoaded]);

  // Initialize map
  useEffect(() => {
    if (!showRoutePlanner || !mapContainerRef.current || mapRef.current) return;
    
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [22.5, -33.95],
      zoom: 8.5,
      pitch: 30,
    });
    
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Wait for map to load before allowing route drawing
    map.on('load', () => {
      setMapLoaded(true);
    });
    
    mapRef.current = map;
    
    return () => {
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, [showRoutePlanner]);

  // Update markers when stops change
  useEffect(() => {
    if (!mapRef.current || !showRoutePlanner || !mapLoaded) return;
    
    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    
    const map = mapRef.current;
    
    // Add start marker
    if (startLocation) {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-sm border-2 border-white shadow-lg';
      el.innerHTML = 'S';
      const marker = new mapboxgl.Marker(el)
        .setLngLat(startLocation.coords)
        .addTo(map);
      markersRef.current.push(marker);
    }
    
    // Add stop markers
    tripStops.forEach((stop, index) => {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-sky-500 text-white font-bold text-sm border-2 border-white shadow-lg';
      el.innerHTML = String(index + 1);
      const marker = new mapboxgl.Marker(el)
        .setLngLat(stop.business.coords)
        .setPopup(new mapboxgl.Popup().setHTML(`<div class="p-2"><strong>${stop.business.name}</strong><br/><span class="text-gray-600">${stop.townName}</span></div>`))
        .addTo(map);
      markersRef.current.push(marker);
    });
    
    // Add end marker
    if (hasEndPoint && endLocation) {
      const el = document.createElement('div');
      el.className = 'flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-sm border-2 border-white shadow-lg';
      el.innerHTML = 'E';
      const marker = new mapboxgl.Marker(el)
        .setLngLat(endLocation.coords)
        .addTo(map);
      markersRef.current.push(marker);
    }
    
    // Fit bounds to show all markers
    if (tripStops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      if (startLocation) bounds.extend(startLocation.coords);
      tripStops.forEach(stop => bounds.extend(stop.business.coords));
      if (hasEndPoint && endLocation) bounds.extend(endLocation.coords);
      map.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
    
    // Fetch route when stops change
    const id = setTimeout(() => {
      void fetchRoute();
    }, 0);

    return () => clearTimeout(id);
  }, [tripStops, startLocation, endLocation, hasEndPoint, showRoutePlanner, mapLoaded, fetchRoute]);

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newStops = [...tripStops];
    const draggedStop = newStops[draggedItem];
    newStops.splice(draggedItem, 1);
    newStops.splice(index, 0, draggedStop);
    newStops.forEach((stop, i) => stop.order = i);
    
    setTripStops(newStops);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const removeStop = (index: number) => {
    const newStops = tripStops.filter((_, i) => i !== index);
    newStops.forEach((stop, i) => stop.order = i);
    setTripStops(newStops);
  };

  const updateStopDuration = (index: number, duration: number) => {
    const newStops = [...tripStops];
    newStops[index].duration = duration;
    setTripStops(newStops);
  };

  // Add a new stop from business
  const addStop = (business: BusinessPoint, townId: string, townName: string) => {
    const newStop: TripStop = {
      id: `${townId}:${business.name}`,
      business,
      townId,
      townName,
      order: tripStops.length,
      duration: 60,
    };
    setTripStops([...tripStops, newStop]);
    setShowAddStop(false);
    setStopSearchQuery('');
  };

  // Check if business is already in stops
  const isInStops = (businessName: string) => {
    return tripStops.some(stop => stop.business.name === businessName);
  };

  // Calculate total trip time
  const totalTripTime = useMemo(() => {
    const stopTime = tripStops.reduce((acc, stop) => acc + (stop.duration || 60), 0);
    const driveTime = routeInfo?.duration || 0;
    return stopTime + driveTime;
  }, [tripStops, routeInfo]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  // Generate Google Maps directions URL for the entire trip
  const generateGoogleMapsDirectionsUrl = () => {
    const waypoints: string[] = [];
    
    // Add start location
    if (startLocation) {
      waypoints.push(`${startLocation.coords[1]},${startLocation.coords[0]}`);
    }
    
    // Add all stops
    tripStops.forEach(stop => {
      waypoints.push(`${stop.business.coords[1]},${stop.business.coords[0]}`);
    });
    
    // Add end location if exists
    if (hasEndPoint && endLocation) {
      waypoints.push(`${endLocation.coords[1]},${endLocation.coords[0]}`);
    }
    
    if (waypoints.length < 2) return '#';
    
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const middleWaypoints = waypoints.slice(1, -1);
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
    
    if (middleWaypoints.length > 0) {
      url += `&waypoints=${middleWaypoints.join('|')}`;
    }
    
    return url;
  };

  // Save trip to localStorage or API
  const saveTrip = async () => {
    const defaultName = `Garden Route Trip - ${new Date().toLocaleDateString()}`;
    const tripData: Omit<SavedTrip, 'id'> & { id?: string } = {
      name: tripTitle.trim() || defaultName,
      startLocation,
      endLocation,
      hasEndPoint,
      stops: tripStops,
      routeInfo,
      totalTime: totalTripTime,
      createdAt: new Date().toISOString(),
    };
    
    if (session?.user) {
      try {
        const response = await fetch('/api/user/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', trip: tripData }),
        });
        if (response.ok) {
          const { trip: savedTrip } = await response.json();
          setSavedTrips(prev => [savedTrip, ...prev]);
          setTripTitle('');
        }
      } catch (error) {
        logError('Failed to save trip to database:', error);
      }
    } else {
      const tripWithId = { ...tripData, id: Date.now().toString() } as SavedTrip;
      const updatedTrips = [...savedTrips, tripWithId];
      setSavedTrips(updatedTrips);
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
      setTripTitle(''); // Reset title after saving
    }
  };

  // Delete a saved trip
  const deleteTrip = async (tripId: string) => {
    if (session?.user) {
      try {
        const response = await fetch('/api/user/trips', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', tripId }),
        });
        if (response.ok) {
          setSavedTrips(prev => prev.filter(t => t.id !== tripId));
        }
      } catch (error) {
        logError('Failed to delete trip from database:', error);
      }
    } else {
      const updatedTrips = savedTrips.filter(t => t.id !== tripId);
      setSavedTrips(updatedTrips);
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    }
  };

  // Update trip name
  const updateTripName = async (tripId: string, newName: string) => {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    if (session?.user) {
      try {
        const tripToUpdate = savedTrips.find(t => t.id === tripId);
        if (tripToUpdate) {
          const response = await fetch('/api/user/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'save', 
              trip: { ...tripToUpdate, name: trimmedName } 
            }),
          });
          if (response.ok) {
            setSavedTrips(prev => prev.map(t => t.id === tripId ? { ...t, name: trimmedName } : t));
          }
        }
      } catch (error) {
        logError('Failed to update trip name in database:', error);
      }
    } else {
      const updatedTrips = savedTrips.map(t => 
        t.id === tripId ? { ...t, name: trimmedName } : t
      );
      setSavedTrips(updatedTrips);
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
    }
    setEditingTripId(null);
    setEditingTripName('');
  };

  // Load a saved trip into the planner
  const loadTrip = (trip: SavedTrip) => {
    setTripStops(trip.stops);
    setStartLocation(trip.startLocation);
    setEndLocation(trip.endLocation);
    setHasEndPoint(trip.hasEndPoint);
    setRouteInfo(trip.routeInfo);
    setTripTitle(trip.name);
    setShowRoutePlanner(true);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#04060c] flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#04060c] text-slate-200">
      <div className="noise-overlay" />
      
      {/* Background Glows */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-300" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                  My Trip
                </h1>
                <p className="text-sm text-slate-400">
                  {favoriteBusinesses.length} saved place{favoriteBusinesses.length !== 1 ? 's' : ''} across the Garden Route
                </p>
              </div>
            </div>
            
            {favoriteBusinesses.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all saved places?')) {
                    clearFavorites();
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-xl border border-red-500/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Description Banner with Plan Trip Button */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6">
        <div className="glass rounded-2xl border border-white/10 p-6 bg-gradient-to-r from-sky-500/5 to-purple-500/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
              <Navigation className="w-6 h-6 text-sky-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-2">Curate Your Perfect Garden Route Adventure</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Save hand-picked places you want to visit and let our AI help you plan the perfect route. 
                Whether you&apos;re planning your next trip or bookmarking hidden gems for a future visit, 
                My Trip is your personal Garden Route itinerary builder.
              </p>
              {favoriteBusinesses.length >= 2 && !showRoutePlanner && (
                <button
                  onClick={() => {
                    initializeTripStops();
                    setShowRoutePlanner(true);
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25"
                >
                  <Sparkles className="w-5 h-5" />
                  Plan My Route with AI
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Route Planner View */}
      {showRoutePlanner && (
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6">
          <div className="glass rounded-2xl border border-white/10 overflow-hidden">
            {/* Route Planner Header with Trip Title */}
            <div className="p-4 border-b border-white/10 bg-slate-900/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20">
                    <Route className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">AI Route Planner</h3>
                    <p className="text-xs text-slate-400">Drag stops to reorder • Click to edit duration</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRoutePlanner(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              {/* Trip Title Input */}
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  placeholder="Name your trip (e.g., Weekend Beach Hopping)"
                  className="flex-1 bg-slate-800/50 text-white text-sm px-3 py-2 rounded-lg border border-white/10 focus:border-sky-500/50 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: Trip Stops */}
              <div className="p-4 border-r border-white/10">
                {/* Start Location */}
                <div className="mb-4">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">Start Location</label>
                  <div className="relative">
                    <div
                      onClick={() => setShowStartDropdown(!showStartDropdown)}
                      className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 hover:border-emerald-500/30 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">S</div>
                      <input
                        type="text"
                        value={showStartDropdown ? startSearchQuery : (startLocation?.name || '')}
                        onChange={(e) => setStartSearchQuery(e.target.value)}
                        onClick={(e) => { e.stopPropagation(); setShowStartDropdown(true); }}
                        placeholder="Search or select start point..."
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"
                      />
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showStartDropdown ? 'rotate-180' : ''}`} />
                    </div>
                    {showStartDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden max-h-64 overflow-y-auto">
                        {filteredStartLocations.length > 0 ? (
                          filteredStartLocations.map((loc) => (
                            <button
                              key={loc.name}
                              onClick={() => {
                                setStartLocation(loc);
                                setShowStartDropdown(false);
                                setStartSearchQuery('');
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-emerald-500/10 text-sm border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors ${startLocation?.name === loc.name ? 'bg-emerald-500/20 text-emerald-300' : 'text-white'}`}
                            >
                              <MapPin className="w-4 h-4 text-emerald-400" />
                              {loc.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-slate-400 text-sm">No locations found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Trip Stops */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Your Stops ({tripStops.length})</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddStop(true)}
                        className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Stop
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        onClick={optimizeRoute}
                        disabled={isOptimizing || tripStops.length < 2}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isOptimizing ? (
                          <>
                            <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Optimize
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {tripStops.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                        <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">No stops added yet</p>
                        <button
                          onClick={() => setShowAddStop(true)}
                          className="mt-2 text-xs text-sky-400 hover:text-sky-300"
                        >
                          + Add your first stop
                        </button>
                      </div>
                    ) : (
                      tripStops.map((stop, index) => (
                        <div
                          key={stop.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/10 hover:border-sky-500/30 transition-all cursor-move group ${draggedItem === index ? 'opacity-50 scale-95' : ''}`}
                        >
                          <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 flex-shrink-0 transition-colors" />
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{stop.business.name}</p>
                            <p className="text-slate-500 text-xs">{stop.townName} • {stop.business.category}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg border border-white/10 px-2 py-1">
                              <input
                                type="number"
                                min="5"
                                max="480"
                                value={stop.duration || 60}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 60;
                                  updateStopDuration(index, Math.min(480, Math.max(5, val)));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-10 bg-transparent text-white text-xs text-center outline-none"
                              />
                              <span className="text-slate-400 text-xs">min</span>
                            </div>
                            <button
                              onClick={() => removeStop(index)}
                              className="p-1.5 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* End Location Toggle */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">End Location</label>
                    <button
                      onClick={() => {
                        setHasEndPoint(!hasEndPoint);
                        if (hasEndPoint) setEndLocation(null);
                      }}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${hasEndPoint ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-700/50 text-slate-400 border border-white/10 hover:bg-slate-700'}`}
                    >
                      {hasEndPoint ? 'One-way trip' : 'Add end point'}
                    </button>
                  </div>
                  
                  {hasEndPoint && (
                    <div className="relative">
                      <div
                        onClick={() => setShowEndDropdown(!showEndDropdown)}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-white/10 hover:border-red-500/30 transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">E</div>
                        <input
                          type="text"
                          value={showEndDropdown ? endSearchQuery : (endLocation?.name || '')}
                          onChange={(e) => setEndSearchQuery(e.target.value)}
                          onClick={(e) => { e.stopPropagation(); setShowEndDropdown(true); }}
                          placeholder="Search or select end point..."
                          className="flex-1 bg-transparent text-white text-sm placeholder:text-slate-500 outline-none"
                        />
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showEndDropdown ? 'rotate-180' : ''}`} />
                      </div>
                      {showEndDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-30 overflow-hidden max-h-64 overflow-y-auto">
                          {filteredEndLocations.length > 0 ? (
                            filteredEndLocations.map((loc) => (
                              <button
                                key={loc.name}
                                onClick={() => {
                                  setEndLocation(loc);
                                  setShowEndDropdown(false);
                                  setEndSearchQuery('');
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-red-500/10 text-sm border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors ${endLocation?.name === loc.name ? 'bg-red-500/20 text-red-300' : 'text-white'}`}
                              >
                                <MapPin className="w-4 h-4 text-red-400" />
                                {loc.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-slate-400 text-sm">No locations found</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Trip Summary */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-3">Trip Summary</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-sky-400">{tripStops.length}</div>
                      <div className="text-xs text-slate-400">Stops</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-emerald-400">{routeInfo ? `${routeInfo.distance.toFixed(0)}km` : '--'}</div>
                      <div className="text-xs text-slate-400">Distance</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{formatDuration(totalTripTime)}</div>
                      <div className="text-xs text-slate-400">Total Time</div>
                    </div>
                  </div>
                  {routeInfo && (
                    <p className="text-xs text-slate-400 mt-3 text-center">
                      <Car className="w-3 h-3 inline mr-1" />
                      {formatDuration(routeInfo.duration)} driving + {formatDuration(totalTripTime - routeInfo.duration)} at stops
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  {/* Get Directions Button */}
                  {routeInfo && tripStops.length > 0 && (
                    <a
                      href={generateGoogleMapsDirectionsUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </a>
                  )}
                  
                  {/* Save Trip Button */}
                  <button
                    onClick={saveTrip}
                    disabled={tripStops.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 rounded-xl transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Heart className="w-4 h-4" />
                    Save Trip
                  </button>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    initializeTripStops();
                    setStartLocation(null);
                    setEndLocation(null);
                    setHasEndPoint(true);
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-white/10 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Trip
                </button>
              </div>

              {/* Right: Map */}
              <div className="h-[500px] lg:h-auto min-h-[400px]">
                <div ref={mapContainerRef} className="w-full h-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Stop Modal - z-[100] to be above header */}
      {showAddStop && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => {
              setShowAddStop(false);
              setStopSearchQuery('');
            }}
          />
          <div className="relative w-full max-w-lg max-h-[90vh] bg-slate-900/98 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/20">
                  <Plus className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Add a Stop</h3>
                  <p className="text-xs text-slate-400">Search for businesses to add to your trip</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddStop(false);
                  setStopSearchQuery('');
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={stopSearchQuery}
                  onChange={(e) => setStopSearchQuery(e.target.value)}
                  placeholder="Search restaurants, hotels, activities..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {/* Business Results */}
            <div className="flex-1 overflow-y-auto">
              {filteredBusinessesForStops.length > 0 ? (
                <div className="p-2">
                  {/* Show "Suggested places" label when no search query */}
                  {!stopSearchQuery.trim() && (
                    <div className="px-3 py-2 mb-2">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Suggested places to stop</p>
                    </div>
                  )}
                  {filteredBusinessesForStops.map(({ business, townId, townName }) => {
                    const alreadyAdded = isInStops(business.name);
                    return (
                      <button
                        key={`${townId}:${business.name}`}
                        onClick={() => !alreadyAdded && addStop(business, townId, townName)}
                        disabled={alreadyAdded}
                        className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                          alreadyAdded 
                            ? 'bg-slate-800/30 opacity-50 cursor-not-allowed' 
                            : 'hover:bg-sky-500/10 hover:border-sky-500/30'
                        } border border-transparent`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-400/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-sky-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{business.name}</p>
                          <p className="text-slate-500 text-xs truncate">
                            {townName} • {business.category}
                            {business.subcategory && ` • ${business.subcategory}`}
                          </p>
                        </div>
                        {alreadyAdded ? (
                          <span className="text-xs text-slate-500 px-2 py-1 bg-slate-800 rounded-full">Added</span>
                        ) : (
                          <Plus className="w-5 h-5 text-sky-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <MapPin className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No businesses found</p>
                  <p className="text-slate-500 text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>

            {/* Quick Categories */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50">
              <p className="text-xs text-slate-500 mb-2">Quick filters:</p>
              <div className="flex flex-wrap gap-2">
                {['Restaurant', 'Hotel', 'Adventure', 'Coffee', 'Beach'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setStopSearchQuery(cat)}
                    className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 rounded-full border border-white/10 hover:border-sky-500/30 transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Trips Section - Between description and saved places */}
      {savedTrips.length > 0 && !showRoutePlanner && (
        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Route className="w-5 h-5 text-emerald-400" />
              My Saved Trips
            </h3>
            <span className="text-xs text-slate-500">{savedTrips.length} trip{savedTrips.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedTrips.map((trip) => (
              <div
                key={trip.id}
                className="glass rounded-xl border border-white/10 p-4 hover:border-sky-500/30 transition-all group"
              >
                {/* Trip Name - Editable */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  {editingTripId === trip.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTripName}
                        onChange={(e) => setEditingTripName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateTripName(trip.id, editingTripName);
                          if (e.key === 'Escape') { setEditingTripId(null); setEditingTripName(''); }
                        }}
                        autoFocus
                        className="flex-1 bg-slate-800/50 text-white text-sm px-2 py-1 rounded border border-sky-500/50 outline-none"
                      />
                      <button
                        onClick={() => updateTripName(trip.id, editingTripName)}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h4 className="font-semibold text-white text-sm truncate flex-1">{trip.name}</h4>
                      <button
                        onClick={() => { setEditingTripId(trip.id); setEditingTripName(trip.name); }}
                        className="p-1 text-slate-500 hover:text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
                
                {/* Trip Info */}
                <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {trip.stops.length} stops
                  </span>
                  {trip.routeInfo && (
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3" />
                      {trip.routeInfo.distance.toFixed(0)}km
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(trip.totalTime)}
                  </span>
                </div>
                
                {/* Created Date */}
                <p className="text-[10px] text-slate-500 mb-3">Created {formatDate(trip.createdAt)}</p>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => loadTrip(trip)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Load Trip
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete this trip?')) deleteTrip(trip.id);
                    }}
                    className="p-2 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content - Saved Places Grid */}
      <main className="max-w-6xl mx-auto px-6 md:px-10 py-8 pb-28">
        {favoriteBusinesses.length === 0 && savedTrips.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/10">
              <Heart className="w-12 h-12 text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              No saved places yet
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Tap the heart icon on any business to save it to your trip planner. Build your perfect Garden Route itinerary!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-2xl font-semibold hover:from-sky-400 hover:to-blue-500 transition-all shadow-xl shadow-sky-500/25"
            >
              <MapPin className="w-5 h-5" />
              Explore Garden Route
            </Link>
          </div>
        ) : (
          <>
            {!showRoutePlanner && (
              <h3 className="text-lg font-semibold text-white mb-4">Your Saved Places</h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteBusinesses.map(({ business, townId }) => (
                <BusinessCard
                  key={`${townId}:${business.name}`}
                  business={business}
                  townId={townId}
                  onViewMap={handleViewOnMap}
                  isFavorite={isFavorite}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Separate component to handle individual business card with photo fetching
function BusinessCard({
  business,
  townId,
  onViewMap,
  isFavorite,
  toggleFavorite
}: {
  business: BusinessPoint;
  townId: string;
  onViewMap: (townId: string, businessName: string) => void;
  isFavorite: (townId: string, businessName: string) => boolean;
  toggleFavorite: (townId: string, businessName: string) => void;
}) {
  const { photos, isLoading, isPlaceholder } = useBusinessPhotos(
    business.name, 
    townId, 
    business.category, 
    business.subcategory
  );
  const saved = isFavorite(townId, business.name);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Use fetched photos (including Unsplash fallback) or static photos
  const photoUrl = photos.length > 0 
    ? (isPlaceholder ? photos[0] : getPhotoUrl(photos[0], 400))
    : business.photos?.[0] 
      ? getPhotoUrl(business.photos[0], 400) 
      : null;

  return (
    <div
      className="group relative bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden hover:border-sky-500/30 transition-all cursor-pointer backdrop-blur-sm"
      onClick={() => onViewMap(townId, business.name)}
    >
      {/* Image */}
      <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
        {/* Preload slot keeps layout; show gradient skeleton until image ready */}
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt={business.name}
              loading="eager"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              className={`w-full h-full object-cover transition-transform duration-500 ${imageLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"}`}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 animate-pulse" />
            )}
          </>
        ) : isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-10 h-10 text-slate-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />
        
        {/* Heart Button - Blue glow outline for visibility */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(townId, business.name);
          }}
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 rounded-full backdrop-blur-sm border-2 border-sky-400/60 hover:scale-110 transition-transform shadow-[0_0_10px_rgba(56,189,248,0.4)] hover:shadow-[0_0_15px_rgba(56,189,248,0.6)]"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              saved ? "fill-sky-400 text-sky-400" : "text-sky-300"
            }`}
          />
        </button>

        {/* Town Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-sky-500/80 text-white text-xs font-semibold capitalize">
          {townId}
        </div>

        {/* Stock Image Badge - shown for placeholder images */}
        {isPlaceholder && photoUrl && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-slate-300 border border-white/10">
            Stock image
          </div>
        )}

        {/* Rating */}
        {business.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-bold text-white">{business.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-medium text-sky-400 uppercase tracking-wide">
          {business.category}
        </span>
        <h3 className="font-semibold text-white mt-1 truncate group-hover:text-sky-300 transition-colors">
          {business.name}
        </h3>
        {business.address && (
          <p className="text-xs text-slate-400 mt-1 truncate">
            {business.address}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors"
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
          )}
          {business.googleMapsUrl && (
            <a
              href={business.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors ml-auto"
            >
              <Navigation className="w-3 h-3" />
              Directions
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
