import { Request, onRequest } from "firebase-functions/v2/https"
import { ASSIGNED, db, Licence, TopLevelLicence, LicenceSummary, SUMMARY } from "./shared"
import { Timestamp, FieldValue } from "firebase-admin/firestore"

const LICENCE_VALIDITY_FOR_DAYS = 365 // TODO: Move this to config
const APP_KEY = "awesome" //TODO: Move this to config | functions:config:set appKey='secret-key' | functions.config().appKey;
const MAX_ALLOWED_DEVICES = 3;

export const acceptLicence = onRequest( async (request, response) => {
  let licenceId = ''  

  try {
    const {errorMessage, email, deviceId} = extractDataFromValidRequest(request)    
    licenceId = email
    
    if(errorMessage) {
      response.status(400).send({ error: errorMessage })
      return
    }
    
    const topLevelLicence = await getTopLevelLicence(email)

    if(!topLevelLicence || !topLevelLicence!.customerId) {      
      console.error(`Licence not found for : ${email}`)
      response.status(400).send({ error: 'Licence Not Found' })
      return
    }

    const deviceIdExists = topLevelLicence!.deviceIds.includes(deviceId)

    if(!deviceIdExists && topLevelLicence!.deviceIds.length >= MAX_ALLOWED_DEVICES) {      
      response.status(400).send({ error: 'Device Limit Exceeded' })      
      return
    }

    await acceptInvitation(topLevelLicence!, deviceId);
    response.status(200).send('Success')
    return 
  }  catch (error) {
    console.error(`Error processing acceptLicence API request for email: ${licenceId} with error`, error )
    response.status(400).send('Invalid Request')    
    return
  }    
})

function extractDataFromValidRequest(request: Request) {
    const request_key = request.get('authorization');
    const email = request.body.email;
    const deviceId = request.body.deviceId;
    console.log('request_key:', request_key)
    console.log('email:', email)
    console.log('deviceId', deviceId)
    
    let errorMessage = undefined

    
    if(APP_KEY !== request_key) {  
      console.error('Security Key does not match or does not exists')    
      errorMessage = 'Invalid Security Header'
    } else if(!email) {      
      console.error('Missing email') 
      errorMessage = 'Missing field - email'           
    } else if(!deviceId) {      
      console.error('Missing deviceId')            
      errorMessage = 'Missing field - deviceId'           
    }      
    return {errorMessage, email, deviceId}
}

async function getTopLevelLicence(emailId: string) {
  try { 
    const topLevelLicenceRef = db.collection('topLevelLicence').doc(emailId)
    const topLevelLicence = await topLevelLicenceRef.get()
    
    if(!topLevelLicence.exists) { // Licence does not exists !!!
      return undefined
    }
    const topLevelLicenceData = JSON.parse(JSON.stringify(topLevelLicence.data())) as TopLevelLicence
    return topLevelLicenceData
  } catch(error) {
    console.error(`Error fetching topLevelLicence for ${emailId}`, error)
    return undefined
  }
  
}

async function acceptInvitation(topLevelLicence: TopLevelLicence, deviceId: string) {
  try {    
    const customerId = topLevelLicence.customerId
    const licenceId = topLevelLicence.email
    const isFirstDevice = topLevelLicence.deviceIds.length == 0
    const isNewDevice = !topLevelLicence.deviceIds.includes(deviceId)
  
    console.log(`Processing Invitation for ${customerId} and ${licenceId} on first device? ${isFirstDevice}`)
    
    let licenceData: Licence;
    
    if(isFirstDevice) {
      const currentDate = new Date()   
      const validTill = new Date()
      validTill.setDate(validTill.getDate() + LICENCE_VALIDITY_FOR_DAYS)
      console.log('validTill:', validTill)
      licenceData = {    
        email: licenceId,
        invitedOn: undefined, // No need to update
        activatedOn: Timestamp.fromDate(currentDate), 
        validTill: Timestamp.fromDate(validTill),
        status: ASSIGNED
      }
  
      topLevelLicence.activatedOn = Timestamp.fromDate(currentDate)
      topLevelLicence.validTill = Timestamp.fromDate(validTill)       
    } else {
      // Do not update activation and validity dates if this is not the first device the licence is being installed on 
      licenceData = {    
        email: licenceId,
        invitedOn: undefined,
        activatedOn: undefined,
        validTill: undefined,
        status: ASSIGNED
      }
      // Do not need to update the existing values
      topLevelLicence.activatedOn = undefined 
      topLevelLicence.validTill = undefined 
    }
    
    // Only if the device id is new, append it to the list
    if(isNewDevice) {
      topLevelLicence.deviceIds.push(deviceId)
    }
    topLevelLicence.status = ASSIGNED   
    
    // Decrement available Licence count  
    const lincenceSummary: LicenceSummary = {
      available: undefined,
      pending: FieldValue.increment(-1),
      active: FieldValue.increment(1),
      docType: SUMMARY
    } 
    
    // TODO: DEBUG REMOVE
    console.log(licenceData)
    console.log(topLevelLicence)

    const batch = db.batch()
  
    // update customer licence collection
    const licenseRef = db.collection('customers').doc(customerId).collection('licence').doc(licenceId);
    batch.set(licenseRef, licenceData, {merge: true})
  
    // update top level licence collection
    const topLevelLicenceRef = db.collection('topLevelLicence').doc(licenceId)
    batch.set(topLevelLicenceRef, topLevelLicence, {merge: true})
  
    if(isFirstDevice) { // Adjust counts only if it is first device
      // undefined fields will not be inserted into db because ignoreUndefinedProperties is set to true  
      const customerLicencesSummaryRef = db.collection('customers').doc(customerId).collection('licence').doc('summary')      
      batch.set(customerLicencesSummaryRef, lincenceSummary, {merge: true})
    }  
  
    batch.commit()
  
    console.log("License document updated successfully.");
    return true
  } catch (error) {
    console.error(`Something went wrong while processingInvitation for ${topLevelLicence.email}`)
    return false
  }
}
