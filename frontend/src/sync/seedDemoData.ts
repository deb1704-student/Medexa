import { db } from "@/sync/db";

export const DEMO_PATIENT_ID = "550e8400-e29b-41d4-a716-446655440001";
export const DEMO_EPISODE_ID = "550e8400-e29b-41d4-a716-446655440002";

export async function seedDemoData(): Promise<void> {
  const existingPatient = await db.patients.get(DEMO_PATIENT_ID);

  if (!existingPatient) {
    await db.patients.put({
      id: DEMO_PATIENT_ID,
      fullName: "Rahul Sharma",
      age: 42,
      sex: "male",
      villageOrWard: "Rampur",
      phone: "9876543210",
      chronicConditions: ["Type 2 Diabetes"],
      createdAt: new Date().toISOString(),
    });
  }

  const existingEpisode = await db.careEpisodes.get(DEMO_EPISODE_ID);

  if (!existingEpisode) {
    await db.careEpisodes.put({
      id: DEMO_EPISODE_ID,
      patientId: DEMO_PATIENT_ID,
      status: "open",
      openedAt: new Date().toISOString(),
      followUps: [],
      syncStatus: "synced",
    });
  }
}