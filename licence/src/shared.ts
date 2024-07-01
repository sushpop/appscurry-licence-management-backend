import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'
initializeApp();
const DB_NAME = "appscurry-licence-management"
const db = getFirestore(DB_NAME)
db.settings({ ignoreUndefinedProperties: true }); // ignores undefined peroperties during serializtion

const SUMMARY = 'summary'

// LICENCE STATUS
const PENDING = 'pending'
const ASSIGNED = 'assigned'
const EXPIRED = 'expired'

interface Licence {
  email: string,
  invitedOn: Timestamp | undefined,
  activatedOn: Timestamp | undefined,
  validTill: Timestamp | undefined,
  status: string
}

interface LicenceSummary {
  available: FieldValue | undefined,
  pending: FieldValue | undefined,
  active: FieldValue | undefined,
  docType: string
}

interface TopLevelLicence {
  email: string,
  customerId: string,  
  activatedOn: Timestamp | undefined,
  validTill: Timestamp | undefined,
  status: string | undefined,
  deviceIds: string[]
}

export { db, LicenceSummary, Licence, TopLevelLicence, SUMMARY, DB_NAME, PENDING, ASSIGNED, EXPIRED }


