import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { Timestamp } from "firebase/firestore";
import { getDb } from "../firebase/config";
import { Treatment, TreatmentInput } from "../../shared/types/treatment";

const COLLECTION_NAME = "treatments";

function getTreatmentsCollection(uid: string) {
  return collection(getDb(), "users", uid, COLLECTION_NAME);
}

function getTreatmentDocument(uid: string, treatmentId: string) {
  return doc(getDb(), "users", uid, COLLECTION_NAME, treatmentId);
}

export async function createTreatment(uid: string, input: TreatmentInput) {
  try {
    await addDoc(getTreatmentsCollection(uid), {
      name: input.name.trim(),
      morningDose: input.morningDose.trim(),
      eveningDose: input.eveningDose.trim(),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    throw toTreatmentError(error);
  }
}

export async function updateTreatment(uid: string, treatmentId: string, input: TreatmentInput) {
  try {
    await updateDoc(getTreatmentDocument(uid, treatmentId), {
      name: input.name.trim(),
      morningDose: input.morningDose.trim(),
      eveningDose: input.eveningDose.trim()
    });
  } catch (error) {
    throw toTreatmentError(error);
  }
}

export async function deleteTreatment(uid: string, treatmentId: string) {
  try {
    await deleteDoc(getTreatmentDocument(uid, treatmentId));
  } catch (error) {
    throw toTreatmentError(error);
  }
}

export function subscribeToTreatments(
  uid: string,
  onSuccess: (items: Treatment[]) => void,
  onError: (message: string) => void
) {
  const treatmentsQuery = query(getTreatmentsCollection(uid), orderBy("createdAt", "asc"));

  return onSnapshot(
    treatmentsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((entry) => {
        const data = entry.data();

        return {
          id: entry.id,
          name: String(data.name ?? ""),
          morningDose: String(data.morningDose ?? ""),
          eveningDose: String(data.eveningDose ?? ""),
          createdAt: serializeTimestamp(data.createdAt)
        };
      });

      onSuccess(items);
    },
    (error) => {
      onError(toTreatmentError(error).message);
    }
  );
}

function serializeTimestamp(timestamp: unknown) {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }

  return null;
}

function toTreatmentError(error: unknown) {
  if (error instanceof FirebaseError && error.code === "permission-denied") {
    return new Error(
      "Permissions Firestore insuffisantes pour les traitements. Ajoutez la règle users/{uid}/treatments/{treatmentId}."
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Opération traitement impossible.");
}
