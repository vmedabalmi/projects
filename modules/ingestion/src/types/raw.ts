/**
 * Raw record types — mirror the actual API response shapes exactly.
 * No field renaming, no normalization.
 */

// --- PatentsView API ---

export interface RawPatentsViewAssignee {
  assignee_first_name: string | null;
  assignee_last_name: string | null;
  assignee_organization: string | null;
}

export interface RawPatentsViewInventor {
  inventor_first_name: string | null;
  inventor_last_name: string | null;
}

export interface RawPatentsViewCPC {
  cpc_subgroup_id: string;
}

export interface RawPatentsViewRecord {
  patent_id: string;
  patent_type: string;
  patent_date: string;
  app_date: string;
  patent_title: string;
  assignees: RawPatentsViewAssignee[];
  inventors: RawPatentsViewInventor[];
  cpcs: RawPatentsViewCPC[];
}

export interface RawPatentsViewResponse {
  patents: RawPatentsViewRecord[];
  count: number;
  total_patent_count: number;
}

// --- USPTO Maintenance Fee API ---

export interface RawMaintenanceFeeFeeEvent {
  fee_code: string;
  due_date: string;
  paid_date: string | null;
  status: string;
}

export interface RawMaintenanceFeeRecord {
  patent_number: string;
  small_entity: boolean;
  fee_events: RawMaintenanceFeeFeeEvent[];
  expired: boolean;
}

// --- USPTO Patent Center (ODP) ---

export interface RawPatentCenterContinuity {
  parent_application_number: string;
  child_application_number: string;
  relationship_type: string;
}

export interface RawPatentCenterRecord {
  application_number: string;
  patent_number: string;
  pta_days: number;
  continuity_data: RawPatentCenterContinuity[];
}
