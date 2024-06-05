import { getAuth } from 'firebase-admin/auth'
import {
  onDocumentCreated,
  DocumentOptions
} from "firebase-functions/v2/firestore";
import { CustomerPayment, DB_NAME, LINE_ITEM, REGISTRATION } from './shared';

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
      return;
  }
  
  if(snapshot.data().docType === LINE_ITEM) { // Ignore Summary document
    const payment = JSON.parse(JSON.stringify(snapshot.data())) as CustomerPayment

    // Invoke function copyReceipt()
    console.log('payment', payment, event.params.userId)
    if(payment.type === REGISTRATION) { // Handle registration
      await getAuth().setCustomUserClaims(event.params.userId, customClaims)
      console.log('inserted custom clain for user', event.params.userId)
    }        
  } else {
    console.log('Ignore summary document')
  }

})

// TODO: write a function which takes the receipt_url and writes 
// function copyReceipt() and return internal URL