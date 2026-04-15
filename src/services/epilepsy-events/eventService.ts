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
