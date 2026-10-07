import { Complaint } from '../entities/complaints/complaints.entity';

export const COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY = Symbol(
  'COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY',
);

// Business-level filters: the port knows nothing about Prisma or table relations.
export interface ComplaintsFilter {
  idRegional?: number[];
  idMunicipio?: number[];
  idParceira?: number[];
}

export interface IComplaintsAndOmbudsmansOfficeRepository {
  findAll(filter: ComplaintsFilter): Promise<Complaint[]>;
}
