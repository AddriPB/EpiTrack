import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { getDb } from "../firebase/config";
import { CreateEpilepsyEventInput, EpilepsyEvent } from "../../shared/types/event";
import { toFirestorePayload, toUiEvent } from "./eventTransforms";

const COLLECTION_NAME = "epilepsyEvents";

function getUserEventsCollection(uid: string) {
  return collection(getDb(), "users", uid, COLLECTION_NAME);
}

export async function saveEpilepsyEvent(uid: string, input: CreateEpilepsyEventInput) {
  const payload = toFirestorePayload(input);
  const collectionRef = getUserEventsCollection(uid);

  await addDoc(collectionRef, {
    ...payload,
    createdAt: serverTimestamp()
  });
}

export function subscribeToYearEvents(
  uid: string,
  year: number,
  onSuccess: (events: EpilepsyEvent[]) => void,
  onError: (message: string) => void
) {
  const collectionRef = getUserEventsCollection(uid);
  const eventsQuery = query(collectionRef, where("year", "==", year));

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((document) => toUiEvent(document.id, document.data()));
      items.sort((left, right) => left.dateKey.localeCompare(right.dateKey));
      onSuccess(items);
    },
    (error) => {
      onError(error.message);
    }
  );
}

export function subscribeToYearsEvents(
  uid: string,
  years: number[],
  onSuccess: (events: EpilepsyEvent[]) => void,
  onError: (message: string) => void
) {
  const uniqueYears = Array.from(new Set(years)).sort((left, right) => left - right);

  if (uniqueYears.length === 0) {
    onSuccess([]);
    return () => undefined;
  }

  const collectionRef = getUserEventsCollection(uid);
  const yearFilter = uniqueYears.length === 1
    ? where("year", "==", uniqueYears[0])
    : where("year", "in", uniqueYears);
  const eventsQuery = query(collectionRef, yearFilter);

  return onSnapshot(
    eventsQuery,
    (snapshot) => {
      const items = snapshot.docs.map((document) => toUiEvent(document.id, document.data()));
      items.sort((left, right) => left.dateKey.localeCompare(right.dateKey));
      onSuccess(items);
    },
    (error) => {
      onError(error.message);
    }
  );
}
