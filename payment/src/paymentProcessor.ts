import { onRequest } from "firebase-functions/v2/https"
import { db, stripe } from "./shared"
import { FieldValue } from "firebase-admin/firestore";

const endpointSecret = 'whsec_f0ae5eb6da1d3ddad700200e6eccb8acc589602ee6b7cbcb1cf46a05acfdcf8c'

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
      // Then define and call a method to handle the successful payment intent.
      await insertData(paymentIntent.id, paymentIntent.status, undefined);
      break;    
    case 'charge.succeeded':
      const chargeDetails = event.data.object;
      console.log('priting only the relevant object detils:', chargeDetails)
      console.log(`PaymentIntent ${chargeDetails.payment_intent} for charge was successful!`)
      console.log(`Receipt URL ${chargeDetails.receipt_url} for charge was successful!`)
      await insertData(chargeDetails.payment_intent, undefined, chargeDetails.receipt_url);
      break;    
    default:
      // Unexpected event type
      console.log(`Unhandled event type ${event.type}.`);
  }
         
  console.log('Payment Webhook complete')
  response.sendStatus(200)

})

async function insertData(intentId: string, status: string | undefined, receiptUrl: string | undefined) {
  const data = {
    status: status,
    receipt_url: receiptUrl,    
    timestamp: FieldValue.serverTimestamp()
  }
  console.log('inserting', data)
  return await db.collection('payment_completed').doc(intentId).set(data);
}