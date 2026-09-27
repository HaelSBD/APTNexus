import { useSyncExternalStore } from "react";

const EMPTY = {
  visitorName: "",
  icNumber: "",
  plateNumber: "",
  phone: "",
  unit: "",
  icPhotoUri: "",
  carPhotoUri: "",
  icPhotoUrl: "",
  carPhotoUrl: "",
  documentType: "ic",
  licenceClass: "",
  ocrJob: null,
};

let draft = { ...EMPTY };
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getVisitorDraft() {
  return draft;
}

export function patchVisitorDraft(patch) {
  draft = { ...draft, ...patch };
  emit();
}

export function resetVisitorDraft() {
  draft = { ...EMPTY };
  emit();
}

export function subscribeVisitorDraft(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useVisitorDraft() {
  return useSyncExternalStore(subscribeVisitorDraft, getVisitorDraft, getVisitorDraft);
}
