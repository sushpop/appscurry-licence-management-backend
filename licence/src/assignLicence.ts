import { onCall } from "firebase-functions/v2/https"
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore'

initializeApp();
const DB_NAME = "appscurry-licence-management"
const db = getFirestore(DB_NAME)
db.settings({ ignoreUndefinedProperties: true }); // ignores undefined peroperties during serializtion

// const SUMMARY = 'summary'
// const LINE_ITEM = 'line_item'
const PENDING = 'pending'
// const ASSIGNED = 'assigned'
// const EXPIRED = 'expired'


export const assignLicence = onCall( async (request) => {

  let uid
  try {

    uid = request.auth?.uid!    // This should throw error is uid is missing?

    console.log('Assigning Licences for:', uid)

    console.log('input', request.data)
    const invitations: InvitationRequest = request.data as InvitationRequest

    const failureEmails: string[] = []
    for (const invitation of invitations.records) {
      try {
        await processInvitation(invitation, uid)
        await sendInvitationEmail(invitation)
      } catch (error) {
        console.error(`Error provisioning the licence for ${invitation.email} and user ${uid}:`, error);
        failureEmails.push(invitation.email)
      }    
    }

    if (failureEmails.length === 0) { // All licences assigned successfully
      console.log('Assigning Licences finished for:', uid)
      return {
        response: 'success'
      }
    } else {
      return {
        response: 'error',
        data: failureEmails
      }
    }

  } catch(error) {
    console.error('Assigning Licences process failed :', uid, error)
    return {
      response: 'error'      
    }
  }
})

async function processInvitation(invitation: Invitation, userId: string) {

  const currentDate = new Date();

  const licenceData : Licence = {
    email: invitation.email,
    invitedOn: Timestamp.fromDate(currentDate),
    status: PENDING,
    acceptedOn: undefined,
    validTill: undefined
  }

  const batch = db.batch()

  // Create document in customers/lincence scope
  const customersLicenceRef = db.collection('customers').doc(userId).collection('licence').doc(invitation.email)
  batch.set(customersLicenceRef, licenceData, {merge: true})

  // Create document in licence collection
  const licenceRef = db.collection('licence').doc(invitation.email)
  batch.set(licenceRef, licenceData, {merge: true})

  // Decrement Licence count  
  const customerLicencesSummaryRef = db.collection('customers').doc(userId).collection('licence').doc('summary')      
  batch.set(customerLicencesSummaryRef, {total: FieldValue.increment(-1)}, {merge: true})
  
  // Commit the batch
  await batch.commit()

}

// TODO: Fill in the blanks
async function sendInvitationEmail(invitation: Invitation) {
  console.log('Email Sent to: ', invitation.email)
  return Promise.resolve("success")
}

interface Invitation {
  email: string;
  name: string;
}

interface InvitationRequest {
  records: Invitation[];
}


interface Licence {
  email: string;
  invitedOn: Timestamp;
  acceptedOn: Timestamp | undefined;
  validTill: Timestamp | undefined;
  status: string;
}

// interface SummaryDocument {
//   total: FieldValue
//   docType: string
// }