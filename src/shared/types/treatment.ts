export type Treatment = {
  id: string;
  name: string;
  startDate: string;
  morningDose: string;
  eveningDose: string;
  createdAt: string | null;
};

export type TreatmentInput = {
  name: string;
  startDate: string;
  morningDose: string;
  eveningDose: string;
};
