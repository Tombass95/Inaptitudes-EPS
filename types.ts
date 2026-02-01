
export interface Exemption {
  id: string;
  lastName: string;
  firstName: string;
  studentClass: string;
  receivedAt: string; // ISO Date
  startDate: string; // ISO Date
  endDate: string; // ISO Date
  durationDays: number;
  photoBase64?: string; // Image du certificat stockée
  isParentalNote: boolean;
  isTerminale: boolean; // Flag pour protection Bac
}

export enum SortOrder {
  ALPHA_ASC = 'ALPHA_ASC',
  ALPHA_DESC = 'ALPHA_DESC',
  CHRONO_ASC = 'CHRONO_ASC',
  CHRONO_DESC = 'CHRONO_DESC',
  CLASS_ASC = 'CLASS_ASC'
}
