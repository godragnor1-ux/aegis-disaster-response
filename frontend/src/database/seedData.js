import { Incident } from './schemas/Incident.js';
import { SOSBeacon } from './schemas/SOSBeacon.js';
import { Responder } from './schemas/Responder.js';
import { Shelter } from './schemas/Shelter.js';
import { MissingPerson } from './schemas/MissingPerson.js';
import { ChatMessage } from './schemas/ChatMessage.js';
import { User } from './schemas/User.js';
import { Task } from './schemas/Task.js';

export const seedInitialDisasterData = async () => {
  try {
    console.log('🌱 Checking and seeding disaster response collections...');

    // 0. Seed Users if not present
    let rescuerUser;
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding role-based Auth Users...');
      await User.create({
        name: 'Commander Sarah Briggs',
        email: 'admin@aegis.gov',
        password: 'admin123',
        role: 'admin',
        phone: '+1 (555) 911-0001',
        callsign: 'AEGIS-OVERLORD',
        specialties: ['general', 'reconnaissance'],
        status: 'on_duty',
      });

      rescuerUser = await User.create({
        name: 'Capt. Marcus Vance',
        email: 'rescuer1@aegis.gov',
        password: 'rescuer123',
        role: 'rescuer',
        phone: '+1 (555) 911-0101',
        callsign: 'RESCUE-EAGLE-1',
        specialties: ['swift_water', 'paramedic'],
        status: 'available',
      });

      await User.create({
        name: 'Aarav Sharma',
        email: 'citizen@aegis.gov',
        password: 'citizen123',
        role: 'user',
        phone: '+1 (555) 749-1122',
        specialties: ['general'],
        status: 'available',
      });
    } else {
      rescuerUser = await User.findOne({ role: 'rescuer' });
    }

    // 0.1 Seed Tasks if not present
    const taskCount = await Task.countDocuments();
    if (taskCount === 0) {
      console.log('🌱 Seeding rescue Tasks...');
      await Task.create([
        {
          taskId: 'TASK-2026-001',
          title: 'Sector 4 Swift Water Evacuation (Family of 4)',
          description: 'Deploy inflatable Zodiac rescue boat to extract trapped family with 2 wheelchair-bound elderly individuals from 1st floor balcony.',
          category: 'flood_rescue',
          priority: 'critical',
          status: 'assigned',
          location: { lat: 28.6185, lng: 77.2115, address: 'Sector 4 Flood Balcony' },
          assignedTo: rescuerUser ? rescuerUser._id : null,
          assignedResponderCallsign: 'RESCUE-EAGLE-1',
          survivorsCount: 4,
          requiredSkills: ['swift_water', 'paramedic'],
          hazardsReported: ['2.4m floodwater', 'Submerged live power lines'],
        },
        {
          taskId: 'TASK-2026-002',
          title: 'Pragati Metro Plaza Basement USAR Search',
          description: 'Perform endoscopic camera search and acoustic listening window for survivors trapped beneath concrete parking slab.',
          category: 'debris_extrication',
          priority: 'critical',
          status: 'pending',
          location: { lat: 28.6380, lng: 77.2380, address: 'Pragati Metro Plaza' },
          survivorsCount: 2,
          requiredSkills: ['k9_search', 'heavy_extrication'],
          hazardsReported: ['Secondary structural collapse hazard'],
        },
        {
          taskId: 'TASK-2026-003',
          title: 'Connaught Gas Plume Perimeter Evacuation',
          description: 'Coordinate perimeter roadblock and distribute respiratory gear along Block C.',
          category: 'fire_containment',
          priority: 'high',
          status: 'pending',
          location: { lat: 28.6295, lng: 77.2210, address: 'Connaught Central Junction' },
          survivorsCount: 1,
          requiredSkills: ['firefighter'],
          hazardsReported: ['Toxic carbon monoxide plume'],
        }
      ]);
    }

    // 1. Incidents & Danger Zones
    const incidentCount = await Incident.countDocuments();
    if (incidentCount === 0) {
      await Incident.create([
        {
          title: 'Sector 4 Flash Flood & River Overflow',
          type: 'flood',
          severity: 'critical',
          location: { lat: 28.6139, lng: 77.2090, address: 'Yamuna Riverside Corridor & Sector 4' },
          radiusMeters: 1600,
          dangerPolygon: [
            [28.6250, 77.2000],
            [28.6280, 77.2200],
            [28.6120, 77.2300],
            [28.6000, 77.2150],
            [28.6080, 77.1980]
          ],
          hazardMetrics: {
            waterDepthMeters: 2.4,
            windSpeedKmh: 45,
            temperatureCelsius: 24,
            structuralDamageIndex: 68
          },
          status: 'active',
          affectedCount: 2400,
          description: 'Rapid water surge exceeding flood barrier. 14 ground floors submerged.'
        },
        {
          title: 'Central Grid Gas Main Fire & Smoke Plume',
          type: 'fire',
          severity: 'high',
          location: { lat: 28.6320, lng: 77.2190, address: 'Connaught Central Junction Block C' },
          radiusMeters: 900,
          dangerPolygon: [
            [28.6360, 77.2140],
            [28.6380, 77.2240],
            [28.6280, 77.2260],
            [28.6260, 77.2150]
          ],
          hazardMetrics: {
            waterDepthMeters: 0,
            windSpeedKmh: 28,
            temperatureCelsius: 580,
            structuralDamageIndex: 82
          },
          status: 'active',
          affectedCount: 850,
          description: 'Gas pipeline rupture ignited post-seismic tremor. High toxic carbon monoxide plume.'
        },
        {
          title: 'East Metro Commercial Complex Structural Collapse',
          type: 'collapse',
          severity: 'critical',
          location: { lat: 28.6410, lng: 77.2400, address: 'Pragati Metro Station Plaza' },
          radiusMeters: 750,
          dangerPolygon: [
            [28.6450, 77.2350],
            [28.6470, 77.2450],
            [28.6370, 77.2470],
            [28.6350, 77.2370]
          ],
          hazardMetrics: {
            waterDepthMeters: 0.2,
            windSpeedKmh: 20,
            temperatureCelsius: 28,
            structuralDamageIndex: 94
          },
          status: 'active',
          affectedCount: 420,
          description: 'Multi-story commercial tower collapsed. USAR acoustic search teams deploying.'
        }
      ]);
    }

    // 2. Responders
    const respCount = await Responder.countDocuments();
    if (respCount === 0) {
      await Responder.create([
        {
          callsign: 'RESCUE-EAGLE-1',
          name: 'Capt. Marcus Vance',
          role: 'swift_water',
          phone: '+1 (555) 911-0101',
          location: { lat: 28.6080, lng: 77.1950 },
          status: 'available',
          vehicleType: 'Inflatable Zodiac Rescue Boat',
          equipment: ['Water Jet Pump', 'Thermal Lifeline', 'Defibrillator', 'Sonar Probe'],
          batteryLevel: 98
        },
        {
          callsign: 'MEDIC-VALKYRIE-4',
          name: 'Dr. Sarah Jenkins, MD',
          role: 'paramedic',
          phone: '+1 (555) 911-0202',
          location: { lat: 28.6290, lng: 77.2020 },
          status: 'available',
          vehicleType: 'Tactical Mobile ICU Ambulance',
          equipment: ['Trauma Surgery Kit', 'Blood Plasma Cooler', 'Portable Ventilator'],
          batteryLevel: 89
        },
        {
          callsign: 'FIRE-TITAN-7',
          name: 'Lt. James Rodriguez',
          role: 'firefighter',
          phone: '+1 (555) 911-0303',
          location: { lat: 28.6390, lng: 77.2110 },
          status: 'available',
          vehicleType: 'Hazmat Pumper Tender',
          equipment: ['Foam Cannon', 'Thermal Camera', 'Hydraulic Jaws of Life', 'SCBA Gear'],
          batteryLevel: 94
        },
        {
          callsign: 'K9-SENTINEL-2',
          name: 'Officer Elena Rostova & K9 Buster',
          role: 'k9_search',
          phone: '+1 (555) 911-0404',
          location: { lat: 28.6480, lng: 77.2300 },
          status: 'available',
          vehicleType: 'All-Terrain USAR Buggy',
          equipment: ['Acoustic Vibraphone', 'K9 GPS Harness', 'Endoscopic Snake Camera'],
          batteryLevel: 91
        },
        {
          callsign: 'DRONE-RECON-9',
          name: 'Specialist David Chen',
          role: 'drone_pilot',
          phone: '+1 (555) 911-0505',
          location: { lat: 28.6200, lng: 77.2350 },
          status: 'available',
          vehicleType: 'Mobile Drone Staging Rig',
          equipment: ['Matrice 300 Thermal Drone', 'LIDAR Scanner', 'Emergency Paging Siren'],
          batteryLevel: 100
        }
      ]);
    }

    // 3. Shelters
    const shelterCount = await Shelter.countDocuments();
    if (shelterCount === 0) {
      await Shelter.create([
        {
          name: 'Indira Memorial Sports Complex Safe Haven',
          type: 'evacuation_center',
          location: { lat: 28.5950, lng: 77.2050, address: 'Southern Ridge Elevation Zone, Gate 2' },
          capacity: 1200,
          occupied: 420,
          supplies: {
            waterLiters: 18000,
            foodMREs: 8500,
            powerGenerators: 6,
            medicalBays: 40,
            blankets: 1500
          },
          amenities: ['Emergency Backup Power', 'Filtered Clean Water', 'Childcare Area', 'Sanitation Blocks', 'Satellite Uplink'],
          contactPhone: '+1 (555) 347-SAFE-1',
          status: 'open'
        },
        {
          name: 'AIIMS Field Emergency Hospital Delta',
          type: 'field_hospital',
          location: { lat: 28.5680, lng: 77.2100, address: 'Medical Enclave High Ground' },
          capacity: 650,
          occupied: 310,
          supplies: {
            waterLiters: 12000,
            foodMREs: 4000,
            powerGenerators: 8,
            medicalBays: 85,
            blankets: 800
          },
          amenities: ['Operating Theatres', 'Trauma ICU', 'Blood Bank', 'Decontamination Chamber', 'Helipad'],
          contactPhone: '+1 (555) 347-SAFE-2',
          status: 'open'
        },
        {
          name: 'Northern Sector Technical College Relief Camp',
          type: 'evacuation_center',
          location: { lat: 28.6650, lng: 77.2180, address: 'North Ridge Campus Quad' },
          capacity: 800,
          occupied: 280,
          supplies: {
            waterLiters: 9500,
            foodMREs: 3200,
            powerGenerators: 4,
            medicalBays: 20,
            blankets: 900
          },
          amenities: ['Indoor Gym Shelter', 'Solar Backup', 'Kitchen Distribution Hub'],
          contactPhone: '+1 (555) 347-SAFE-3',
          status: 'open'
        }
      ]);
    }

    // 4. SOS Beacons
    const beaconCount = await SOSBeacon.countDocuments();
    if (beaconCount === 0) {
      await SOSBeacon.create([
        {
          sosId: 'SOS-2026-8812',
          userName: 'Aarav & Meera Sharma (Family of 4)',
          userPhone: '+1 (555) 749-1122',
          location: { lat: 28.6185, lng: 77.2115, accuracy: 4, altitude: 12 },
          batteryLevel: 28,
          urgency: 'critical',
          triageColor: 'red',
          emergencyType: 'flood_rising',
          peopleCount: 4,
          status: 'pending',
          notes: 'Water level reached 1st floor balcony. 2 elderly persons need wheelchair assistance.',
          meshRelayed: true,
          meshHops: 3,
          frontCameraImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=60',
          backCameraImage: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=600&auto=format&fit=crop&q=60'
        },
        {
          sosId: 'SOS-2026-9041',
          userName: 'Vikram Patel',
          userPhone: '+1 (555) 438-9901',
          location: { lat: 28.6380, lng: 77.2380, accuracy: 3, altitude: 4 },
          batteryLevel: 45,
          urgency: 'critical',
          triageColor: 'red',
          emergencyType: 'trapped',
          peopleCount: 2,
          status: 'pending',
          notes: 'Trapped under concrete ceiling slab in basement parking of Commercial Block B.',
          meshRelayed: false,
          meshHops: 0,
          frontCameraImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=60',
          backCameraImage: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=600&auto=format&fit=crop&q=60'
        },
        {
          sosId: 'SOS-2026-6420',
          userName: 'Pooja Gupta',
          userPhone: '+1 (555) 882-3114',
          location: { lat: 28.6295, lng: 77.2210, accuracy: 8, altitude: 18 },
          batteryLevel: 62,
          urgency: 'high',
          triageColor: 'yellow',
          emergencyType: 'fire_smoke',
          peopleCount: 1,
          status: 'pending',
          notes: 'Heavy black smoke entering apartment through ventilation. Has severe asthma.',
          meshRelayed: true,
          meshHops: 2
        }
      ]);
    }

    // 5. Missing Persons
    const missingCount = await MissingPerson.countDocuments();
    if (missingCount === 0) {
      await MissingPerson.create([
        {
          name: 'Rohan Verma',
          age: 9,
          gender: 'Male',
          lastSeenLocation: { lat: 28.6140, lng: 77.2085, addressName: 'Riverfront Market Square' },
          lastSeenDate: new Date(Date.now() - 3600000 * 5),
          photoUrl: 'https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=400&auto=format&fit=crop&q=60',
          clothingDescription: 'Yellow cartoon raincoat, blue jeans, green sneakers.',
          medicalConditions: 'Type 1 Diabetes (requires insulin)',
          reporterName: 'Sunita Verma (Mother)',
          reporterContact: '+1 (555) 982-4411',
          status: 'missing',
          tips: [
            {
              reporterName: 'Volunteer Kabir',
              comment: 'Saw a child in yellow coat heading towards Sector 4 high ground with a rescue group.',
              location: { lat: 28.6110, lng: 77.2040, addressName: 'Sector 4 Flyover' },
              timestamp: new Date(Date.now() - 3600000 * 2)
            }
          ]
        },
        {
          name: 'Devendra Nath',
          age: 74,
          gender: 'Male',
          lastSeenLocation: { lat: 28.6330, lng: 77.2220, addressName: 'Central Block Plaza Near Fire Station' },
          lastSeenDate: new Date(Date.now() - 3600000 * 8),
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=60',
          clothingDescription: 'Grey tweed sweater, brown trousers, silver metal walking cane.',
          medicalConditions: 'Mild dementia and hypertension',
          reporterName: 'Amit Nath (Son)',
          reporterContact: '+1 (555) 334-1188',
          status: 'spotted',
          tips: [
            {
              reporterName: 'Officer Elena (K9-2)',
              comment: 'Elderly gentleman matching description rested at Indira Memorial Sports Complex triage room.',
              location: { lat: 28.5950, lng: 77.2050, addressName: 'Indira Memorial Shelter' },
              timestamp: new Date(Date.now() - 3600000 * 1)
            }
          ]
        },
        {
          name: 'Ananya Deshmukh',
          age: 26,
          gender: 'Female',
          lastSeenLocation: { lat: 28.6410, lng: 77.2400, addressName: 'Pragati Metro Station Plaza Ground Floor' },
          lastSeenDate: new Date(Date.now() - 3600000 * 4),
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60',
          clothingDescription: 'Maroon hoodie, black workout leggings, carrying silver laptop bag.',
          medicalConditions: 'Asthma',
          reporterName: 'Priya Deshmukh (Sister)',
          reporterContact: '+1 (555) 771-3399',
          status: 'missing',
          tips: []
        }
      ]);
    }

    // 6. Chat Messages
    const chatCount = await ChatMessage.countDocuments();
    if (chatCount === 0) {
      await ChatMessage.create([
        {
          channel: 'command_ops',
          senderName: 'Incident Commander Briggs',
          senderRole: 'commander',
          message: 'FLASH DIRECTIVE: All units switch to High Ground Protocol. River level at Yamuna barrier exceeded 2.4m.',
          isEmergencyAlert: true,
          priority: 'flash_override'
        },
        {
          channel: 'responder_tactical',
          senderName: 'Capt. Marcus (RESCUE-EAGLE-1)',
          senderRole: 'responder',
          message: 'Boat unit launched at Sector 4 North Slipway. Heading towards family trapped at SOS-8812.',
          priority: 'urgent'
        },
        {
          channel: 'citizen_public',
          senderName: 'Civil Defense System',
          senderRole: 'system',
          message: 'EMERGENCY BROADCAST: Water pumps operational at Indira Memorial Sports Complex. Clean water and hot meals ready.',
          isEmergencyAlert: true,
          priority: 'urgent'
        }
      ]);
    }

    console.log('✅ Disaster Response scenario & collections verified.');
  } catch (error) {
    console.error('❌ Database seed error:', error);
  }
};
