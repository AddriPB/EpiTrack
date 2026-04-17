export type Treatment = {
  id: string;
  name: string;
  morningDose: string;
  eveningDose: string;
  createdAt: string | null;
};

export type TreatmentInput = {
  name: string;
  morningDose: string;
  eveningDose: string;
};
