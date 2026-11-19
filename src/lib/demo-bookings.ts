/**
 * Frontend-only booking store for the curated "demo" listings on the service
 * detail page. Those listings use human-readable IDs (e.g. `venue-rosewood`)
 * that are not seeded in MongoDB, so `POST /api/v1/bookings` would 404 for
 * them. Saving them locally keeps the date-select -> request -> track ->
 * cancel flow working end-to-end without faking a real backend response.
 *
 * Real vendor services (24-char Mongo ObjectIds) still go through the API.
 * When demo listings are seeded server-side, delete this file and route every
 * booking through `apiRequest` — the bookings page merges both sources.
 */

const STORAGE_KEY = "wedplan.bookings";

export type DemoBookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type DemoBooking = {
  _id: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  serviceCategory?: string;
  serviceImage?: string | null;
  servicePrice?: number | string;
  eventDate: string;
  guestCount: number | null;
  notes: string;
  status: DemoBookingStatus;
  createdAt: string;
  updatedAt: string;
  demo: true;
};

export type DemoBookingInput = Omit<
  DemoBooking,
  "_id" | "status" | "createdAt" | "updatedAt" | "demo"
>;

function isDemoBooking(value: unknown): value is DemoBooking {
  if (typeof value !== "object" || value === null) return false;

  const booking = value as DemoBooking;

  return (
    typeof booking._id === "string" &&
    typeof booking.customerId === "string" &&
    typeof booking.serviceId === "string" &&
    typeof booking.eventDate === "string" &&
    booking.demo === true
  );
}

function readBookings(): DemoBooking[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isDemoBooking) : [];
  } catch {
    // Corrupted JSON / storage disabled — treat as no demo bookings.
    return [];
  }
}

function writeBookings(bookings: DemoBooking[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // Storage full/disabled — the request is not persisted.
  }
}

/** Save a demo booking request and return the saved record. */
export function addDemoBooking(input: DemoBookingInput): DemoBooking {
  const now = new Date().toISOString();
  const booking: DemoBooking = {
    ...input,
    _id: `demo-${crypto.randomUUID()}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    demo: true,
  };

  writeBookings([booking, ...readBookings()]);
  return booking;
}

/** Demo bookings belonging to the signed-in user, newest first. */
export function getDemoBookings(customerId?: string | null): DemoBooking[] {
  const all = readBookings();
  if (!customerId) return [];
  return all.filter((booking) => booking.customerId === customerId);
}

/** Cancel a pending demo booking. Returns true when a row was updated. */
export function cancelDemoBooking(id: string): boolean {
  const bookings = readBookings();
  const index = bookings.findIndex((booking) => booking._id === id);
  if (index === -1 || bookings[index].status !== "pending") return false;

  bookings[index] = {
    ...bookings[index],
    status: "cancelled",
    updatedAt: new Date().toISOString(),
  };
  writeBookings(bookings);
  return true;
}
