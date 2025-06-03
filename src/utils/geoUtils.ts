// Utility function for geolocation

/**
 * Get the user's current location using browser geolocation API
 * with fallback to IP-based geolocation
 */
export async function getCurrentLocation(): Promise<{lat: number, lng: number, source: 'browser' | 'ip' | 'default'}> {
  // Try browser geolocation first
  if (navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        source: 'browser'
      };
    } catch (error: any) {
      console.error(`Browser geolocation error: Code ${error.code}`, error.message || "No error message available");
      // Fall through to IP-based geolocation
    }
  }
  
  // Fallback to IP-based geolocation
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.latitude && data.longitude) {
      return {
        lat: data.latitude,
        lng: data.longitude,
        source: 'ip'
      };
    }
    
    throw new Error("Location data not available from IP");
  } catch (err) {
    console.error("IP geolocation fallback error:", err);
    
    // Return default coordinates (center of Saudi Arabia)
    return {
      lat: 25.276987,
      lng: 45.086601,
      source: 'default'
    };
  }
} 