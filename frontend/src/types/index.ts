export interface Incident {
  _id: string;
  title: string;
  type: 'flood' | 'fire' | 'earthquake' | 'storm' | 'collapse' | 'chemical' | 'medical_emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  radiusMeters: number;
  dangerPolygon: [number, number][];
  hazardMetrics: {
    waterDepthMeters: number;
    windSpeedKmh: number;
    temperatureCelsius: number;
    structuralDamageIndex: number;
  };
  status: 'active' | 'contained' | 'evacuating' | 'resolved';
  affectedCount: number;
  description: string;
  reportedAt: string;
}

export interface SOSBeacon {
  _id: string;
  sosId: string;
  userName: string;
  userPhone: string;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    altitude?: number;
  };
  batteryLevel: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  triageColor: 'red' | 'yellow' | 'green' | 'black';
  emergencyType: 'trapped' | 'medical' | 'flood_rising' | 'fire_smoke' | 'food_water' | 'elderly_infant';
  peopleCount: number;
  frontCameraImage?: string;
  backCameraImage?: string;
  audioVoiceUrl?: string;
  status: 'pending' | 'assigned' | 'en_route' | 'on_scene' | 'resolved';
  assignedResponderId?: string;
  assignedResponderName?: string;
  notes?: string;
  meshRelayed?: boolean;
  meshHops?: number;
  isOfflineSynced?: boolean;
  smsFallbackTriggered?: boolean;
  createdAt: string;
}

export interface Responder {
  _id: string;
  callsign: string;
  name: string;
  role: 'paramedic' | 'firefighter' | 'swift_water' | 'k9_search' | 'heavy_extrication' | 'drone_pilot';
  phone: string;
  location: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'en_route' | 'on_scene' | 'busy' | 'off_duty';
  activeTaskId?: string | null;
  vehicleType: string;
  equipment: string[];
  batteryLevel: number;
}

export interface Shelter {
  _id: string;
  name: string;
  type: 'evacuation_center' | 'field_hospital' | 'supply_depot' | 'staging_base';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  capacity: number;
  occupied: number;
  supplies: {
    waterLiters: number;
    foodMREs: number;
    powerGenerators: number;
    medicalBays: number;
    blankets: number;
  };
  amenities: string[];
  contactPhone: string;
  status: 'open' | 'full' | 'evacuating' | 'closed';
}

export interface MissingPerson {
  _id: string;
  name: string;
  age: number;
  gender: string;
  lastSeenLocation: {
    lat: number;
    lng: number;
    addressName: string;
  };
  lastSeenDate: string;
  photoUrl: string;
  clothingDescription: string;
  medicalConditions: string;
  reporterName: string;
  reporterContact: string;
  status: 'missing' | 'spotted' | 'sheltered' | 'reunited';
  tips: {
    _id?: string;
    reporterName: string;
    comment: string;
    location?: {
      lat: number;
      lng: number;
      addressName?: string;
    };
    photoUrl?: string;
    timestamp: string;
  }[];
}

export interface ChatMessage {
  _id: string;
  channel: 'citizen_public' | 'responder_tactical' | 'command_ops' | 'walkie_talkie' | 'voice_sos' | 'mesh_relay';
  senderName: string;
  senderRole: 'citizen' | 'responder' | 'commander' | 'dispatcher' | 'system' | 'admin';
  message: string;
  audioUrl?: string;
  audioBase64?: string;
  audioDurationSeconds?: number;
  payloadSizeBytes?: number;
  frequencyMHz?: string;
  isEmergencyAlert?: boolean;
  priority?: 'normal' | 'urgent' | 'flash_override';
  createdAt: string;
}

export interface DamageAnalysisResult {
  success: boolean;
  analyzedAt: string;
  overallSeverity: string;
  triageCategory: string;
  confidenceScore: number;
  metrics: {
    structuralIntegrityPct: number;
    floodDepthEstMeters: number;
    firePerimeterRiskPct: number;
    estimatedTrappedPersons: number;
    evacuationUrgency: string;
    heavyMachineryRequired: boolean;
  };
  detectedHazards: string[];
  boundingBoxes: {
    box: [number, number, number, number];
    label: string;
    confidence: number;
    severity: string;
    color: string;
  }[];
  recommendedAction: string;
}

export interface SafeRouteResult {
  success: boolean;
  mode: string;
  directPath: [number, number][];
  directPathHazard: boolean;
  hazardDetails: string;
  safeWaypoints: [number, number][];
  distanceKm: number;
  etaMinutes: number;
  riskScore: string;
  turnByTurn: {
    instruction: string;
    distance: string;
  }[];
}
