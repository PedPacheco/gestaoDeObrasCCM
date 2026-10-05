export interface IComplaintsAndOmbudsmansOfficeRepository {
  findAll(where: Record<string, any>): Promise<any>;
}

export const COMPLAINTS_AND_OMBUDSMANS_OFFICE_REPOSITORY = Symbol(
  'ComplaintsAndOmbudsmansOfficeRepository',
);
