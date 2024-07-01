import { getAuth } from 'firebase-admin/auth'
import { onDocumentCreated, DocumentOptions } from "firebase-functions/v2/firestore"
import { CustomerPayment, DB_NAME, LINE_ITEM, REGISTRATION } from './shared'

import { Storage } from '@google-cloud/storage'
import axios from 'axios'

const storage = new Storage();
const bucketName = 'snorelabpro-receipts'; // TODO: Move to config

const listen: DocumentOptions = {
  document: "customers/{userId}/payment/{paymentId}",
  database: DB_NAME
}

const customClaims = {
  registrationComplete: true
}

export const paymentPostProcessor =  onDocumentCreated(listen, async (event) => {  

  const snapshot = event.data;
  if (!snapshot) {
      console.log("No data associated with the event");
      return
  }    
  
  const customerId = event.params.userId
  const paymentId = event.params.paymentId

  console.log(`processing payment for: ${customerId} and ${paymentId}`)

  if(snapshot.data().docType === LINE_ITEM) { // Ignore Summary document
    const payment = JSON.parse(JSON.stringify(snapshot.data())) as CustomerPayment
    
    console.log('payment', payment, event.params.userId)
    if(payment.type === REGISTRATION) { // Handle registration
      await getAuth().setCustomUserClaims(event.params.userId, customClaims)
      console.log('inserted custom clain for user', event.params.userId)
    } 

    await processRecipt(payment.receiptUrl, customerId, paymentId)
    console.log('Receipt Processed successfully', event.params.userId)
    return
  } else {
    console.log('Ignore summary document')
    return
  }
})

async function processRecipt(url: string, customerId: string, receiptNumber: string) {  
  console.log(`Extracting information for ${receiptNumber}`)

  const response = await axios.get(url);
  const htmlContent = response.data;

  const filename = `${customerId}/${receiptNumber}.html`
  const file = storage.bucket(bucketName).file(filename)

  // 3. Upload to GCS
  await file.save(htmlContent, { contentType: 'text/html' });
  console.log(`HTML content from ${url} saved to ${filename} in ${bucketName}.`)
} 
