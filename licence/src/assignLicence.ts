import { onCall } from "firebase-functions/v2/https"
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { db, LicenceSummary, Licence, SUMMARY, TopLevelLicence, PENDING } from "./shared"

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

// TODO: Check if available licence is 0 and do not process ... 
async function processInvitation(invitation: Invitation, userId: string) {

  const currentDate = new Date();

  const licenceData : Licence = {
    email: invitation.email,
    invitedOn: Timestamp.fromDate(currentDate),
    status: PENDING,
    activatedOn: undefined,
    validTill: undefined
  }

  const topLevelLicenceData : TopLevelLicence = {
    email: invitation.email,
    customerId: userId, 
    status: PENDING,
    activatedOn: undefined,
    validTill: undefined,
    deviceIds: []
  }

  const batch = db.batch()

  // This will thow error if email already exists
  const customersLicenceRef = db.collection('customers').doc(userId).collection('licence').doc(invitation.email)
  batch.create(customersLicenceRef, licenceData)

  // This will thow error if email already exists
  const licenceRef = db.collection('topLevelLicence').doc(invitation.email)
  batch.create(licenceRef, topLevelLicenceData)

  // Decrement available Licence count  
  const lincenceSummary: LicenceSummary = {
    available: FieldValue.increment(-1),
    pending: FieldValue.increment(1),
    active: undefined,
    docType: SUMMARY
  } 
  
  // undefined fields will not be inserted into db because ignoreUndefinedProperties is set to true  
  const customerLicencesSummaryRef = db.collection('customers').doc(userId).collection('licence').doc('summary')      
  batch.set(customerLicencesSummaryRef, lincenceSummary, {merge: true})

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