export const dayKey = (iso) => new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 10);
export function legacyEnd(trip) {
  const latest = Math.max(
    Date.parse(trip.startsAt),
    ...(trip.stopTimes || []).map((stop) => Date.parse(stop.endsAt)),
  );
  return new Date(dayKey(new Date(latest).toISOString()) + 'T23:59:00+07:00').toISOString();
}
export function normalizePlan(trip) {
  return {
    ...trip,
    endsAt: trip.endsAt || legacyEnd(trip),
    placeDays: trip.placeIds.map((placeId) => ({
      placeId,
      date:
        trip.placeDays?.find((item) => item.placeId === placeId)?.date ||
        dayKey(trip.stopTimes?.find((stop) => stop.placeId === placeId)?.startsAt || trip.startsAt),
    })),
  };
}
export function validatePlan(data, previous, stopTimes) {
  const endsAt = data.endsAt ?? previous?.endsAt ?? legacyEnd({ ...data, stopTimes });
  if (
    typeof endsAt !== 'string' ||
    !Number.isFinite(Date.parse(endsAt)) ||
    Date.parse(endsAt) <= Date.parse(data.startsAt)
  )
    throw new Error('วันและเวลากลับต้องอยู่หลังเวลาเริ่มเที่ยว');
  const first = dayKey(data.startsAt),
    last = dayKey(endsAt);
  if ((Date.parse(last) - Date.parse(first)) / 86400000 >= 366)
    throw new Error('วางแผนได้สูงสุด 366 วันต่อทริป');
  const placeDays =
    data.placeDays ??
    data.placeIds.map((placeId) => ({
      placeId,
      date: (
        data.stopTimes !== undefined
          ? stopTimes.find((stop) => stop.placeId === placeId)?.startsAt
          : null
      )
        ? dayKey(stopTimes.find((stop) => stop.placeId === placeId).startsAt)
        : previous?.placeDays?.find((item) => item.placeId === placeId)?.date ||
          dayKey(stopTimes.find((stop) => stop.placeId === placeId)?.startsAt || data.startsAt),
    }));
  if (
    !Array.isArray(placeDays) ||
    placeDays.length !== data.placeIds.length ||
    new Set(placeDays.map((item) => item?.placeId)).size !== placeDays.length ||
    !placeDays.every(
      (item) =>
        item &&
        data.placeIds.includes(item.placeId) &&
        typeof item.date === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
        Number.isFinite(Date.parse(item.date)) &&
        new Date(item.date).toISOString().slice(0, 10) === item.date &&
        item.date >= first &&
        item.date <= last,
    )
  )
    throw new Error('มีสถานที่อยู่นอกช่วงวันเที่ยว กรุณาย้ายวันของสถานที่ก่อนเปลี่ยนช่วงทริป');
  if (
    !stopTimes.every(
      (stop) =>
        Date.parse(stop.endsAt) <= Date.parse(endsAt) &&
        placeDays.find((item) => item.placeId === stop.placeId)?.date === dayKey(stop.startsAt),
    )
  )
    throw new Error('เวลาเที่ยวต้องตรงกับวันที่เลือกและอยู่ภายในวันเวลาเริ่มเที่ยวถึงวันกลับ');
  return { endsAt: new Date(endsAt).toISOString(), placeDays };
}
