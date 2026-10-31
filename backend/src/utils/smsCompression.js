/**
 * SMS Payload Compression & Parsing Utilities for Zero-Bandwidth Offline Mode
 */

export const encodeSOSMessage = (sosData) => {
  const lat = (+sosData.location?.lat || 0).toFixed(4);
  const lng = (+sosData.location?.lng || 0).toFixed(4);
  const type = (sosData.emergencyType || 'GEN').toUpperCase();
  const urg = (sosData.urgency || 'CRIT').toUpperCase();
  const people = sosData.peopleCount || 1;
  const bat = sosData.batteryLevel || 100;
  const time = Math.floor(Date.now() / 1000);

  return `SOS#${lat},${lng}#${type}#${urg}#P:${people}#BAT:${bat}#T:${time}`;
};

export const decodeSOSMessage = (smsString) => {
  try {
    const parts = smsString.trim().split('#');
    if (parts[0] !== 'SOS') throw new Error('Invalid SOS SMS Header');

    const [lat, lng] = parts[1].split(',').map(Number);
    const emergencyType = parts[2].toLowerCase();
    const urgency = parts[3].toLowerCase();
    const peopleCount = parseInt(parts[4]?.replace('P:', '') || '1');
    const batteryLevel = parseInt(parts[5]?.replace('BAT:', '') || '100');

    return {
      success: true,
      location: { lat, lng },
      emergencyType,
      urgency,
      peopleCount,
      batteryLevel
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
