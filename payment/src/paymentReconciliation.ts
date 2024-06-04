import { onRequest } from "firebase-functions/v2/https"
import { db, stripe, PURCHASE } from "./shared"
import { FieldValue } from "firebase-admin/firestore"
import Stripe from "stripe"

const endpointSecret = 'whsec_Ypf0BcsKC0mt2IeHJjbgfcgjK5oxAIVZ'

export const paymentWebHook = onRequest( async (request, response) => {

  console.log('Payment Webhook invoked')
  const signature = request.headers['stripe-signature']
  console.log('stripe-signature header:', signature)

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      request.rawBody,
      signature,
      endpointSecret
    )
  } catch (err) {
    console.error('Webhook signature verification failed.', err)
    response.sendStatus(400)
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // console.log('priting only the relevant object detils:', paymentIntent)
      console.log(`PaymentIntent id  ${paymentIntent.id} `)
      console.log(`Charge id ${paymentIntent.latest_charge} `)
      console.log(`Description ${paymentIntent.description} `)
      console.log(`Currency ${paymentIntent.currency} `)
      console.log(`Status ${paymentIntent.status} `)

      // Fetch receipt_url
      const intent: Stripe.PaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, { expand: ['latest_charge']})     
      const charge: Stripe.Charge = intent.latest_charge as Stripe.Charge      
      const receiptUrl: string = charge.receipt_url!
      console.log('receiptUrl', receiptUrl)
      const isSuccess = await reconcilePayment(paymentIntent.id, receiptUrl);
      if(!isSuccess) {
        console.error('Something went wrong while processing payment_intent.succeeded event for ', paymentIntent.id)
        response.sendStatus(500)
      }
      break;          
    case 'charge.succeeded': // Not listening for this event TODO: DELETE
      // const chargeDetails = event.data.object;
      // console.log('priting only the relevant object detils:', chargeDetails)
      // console.log(`PaymentIntent ${chargeDetails.payment_intent} for charge was successful!`)
      // console.log(`Receipt URL ${chargeDetails.receipt_url} for charge was successful!`)
      // await insertData(chargeDetails.payment_intent, undefined, chargeDetails.receipt_url);
      break;    
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
         
  console.log('Payment Webhook complete')
  response.sendStatus(200)

})

async function reconcilePayment(intentId: string, receiptUrl: string): Promise<boolean> {

  try {
    const paymentInitiatedRef = db.collection('payment_initiated').doc(intentId)

    const paymentInitiated = await paymentInitiatedRef.get()
  
    if (!paymentInitiated.exists) {
      console.log(`No document for paymentIntent: ${intentId} exists in payment_initiated collection`)
      return false
    }
    const payment = JSON.parse(JSON.stringify(paymentInitiated.data())) as PaymentInitiated
    console.log('payment_initated', payment)
    
    const userId = payment.uid
  
    const paymentData: CustomerPayment= {
      type: payment.type,
      amount: payment.amount,
      quantity: payment.quantity,
      status: 'success',
      receiptUrl: receiptUrl,
      createTime: FieldValue.serverTimestamp(),
      receiptNumber: undefined // Parse receipt and populate this
    }
    console.log('inserting', paymentData, userId)
  
    const batch = db.batch()

    // Create payment line item
    const customerPaymentRef = db.collection('customers').doc(userId).collection('payment').doc(intentId)
    batch.set(customerPaymentRef, paymentData, {merge: true}) // TODO: technically no need for merge as it is going to be insert only opertion
  
    // Update payment summary
    const customerPaymentSummaryRef = db.collection('customers').doc(userId).collection('payment').doc('summary')    
    batch.set(customerPaymentSummaryRef, {total: FieldValue.increment(paymentData.amount)}, {merge: true})
  
    // Update payment summary in case type is purchase
    if(paymentData.type.toLowerCase() === PURCHASE) {
      const customerLicencesSummaryRef = db.collection('customers').doc(userId).collection('licence').doc('summary')    
      batch.set(customerLicencesSummaryRef, {total: FieldValue.increment(paymentData.quantity)}, {merge: true})
    }
    
    // Delete entry from the payment_initiated
    batch.delete(paymentInitiatedRef)
  
    // Commit the batch
    await batch.commit()
    return true 
  } catch (error) {
    console.error('Error while reconcilePayment', error)
    return false
  }
}

interface PaymentInitiated {
  amount: number
  type: string
  uid: string
  quantity: number
  timestamp: FieldValue
}

interface CustomerPayment {
  amount: number
  type: string
  quantity: number
  receiptUrl: string
  status: string,
  createTime: FieldValue
  receiptNumber: string | undefined
}