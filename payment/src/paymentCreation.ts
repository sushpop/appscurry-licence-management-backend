import { onCall } from "firebase-functions/v2/https"

import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue, } from 'firebase-admin/firestore'

import Stripe from 'stripe';
// This is your test secret API key.
const stripe = require("stripe")('sk_test_51PC49AJnK8YalHcBQrlAcRZFwWlvPFAoA7ASM9b0Mn97hXUZGVoOO3hHDPEZTHhHb7qR92XvsNWIuhTEwwKymI0I00qQEXKR3B');

// 2 Types of payment Events: REGISTRATION and PURCHASE
const REGISTRATION: string = 'registration'
const PURCHASE: string = 'purchase'

initializeApp();
const db = getFirestore("appscurry-licence-management");
db.settings({ ignoreUndefinedProperties: true }); // ignores undefined peroperties during serializtion



export const initiatePayment = onCall( async (request) => {
  let uid
  try {
    uid = request.auth?.uid
    console.log('Create payment intent strated for:', uid)

    const type = request.data.type as string
    const amount = request.data.amount as number
    const quantity = request.data.quantity as number

    console.log('input', type, amount, quantity)

    validateInput(type, amount, quantity)

    const pricingInfo = await getPricing()    
    const pricingDetails = JSON.parse(JSON.stringify(pricingInfo!)) as Pricing
    validatePricing(type, amount, quantity, pricingDetails)
        
    const paymentIntent: Stripe.PaymentIntent = await createPaymentIntent(amount * 100, type, pricingDetails.currency)
    await insertData(paymentIntent.id, uid!, type, amount, quantity)

    console.log('Create payment intent Finished for:', uid)
    return {
      response: 'success',
      paymentIntent: paymentIntent.client_secret
    }
  } catch(error) {
    console.error('Error initiating Payment Intent for:', uid, error)
    return {
      response: 'error'
    }
  }
})


export async function getPricing() {
  const pricingReference = db.collection('pricing').doc('active')
  const pricingDoc = await pricingReference.get()
  
  if(!pricingDoc.exists) {
    console.error('no active pricing found in database.') 
    // Red Flag // TODO: Trigger email to support ?
    throw new Error('NO_PRICING_FOUND')    
  } else {
    console.log(pricingDoc.data())
    return pricingDoc.data()
  }
}

function calculatePurchasePrice(quantity: number, priceTier: Tier) {
  console.log('input to calculatePurchasePrice()', priceTier)
  const sortedTiers = Object.entries(priceTier)
    .map(([tier, price]) => [parseInt(tier), price])
    .sort((a, b) => Number(a) - Number(b));

  let cost = 0;
  let remainingQuantity = quantity;

  for (let i = 0; i < sortedTiers.length; i++) {

    const [tier, price] = sortedTiers[i];    
    
    const nextTier = i < sortedTiers.length - 1 ? sortedTiers[i + 1][0] : Infinity;
    const quantityInTier = Math.min(remainingQuantity, nextTier - tier)

    cost += quantityInTier * price; 
    
    remainingQuantity -= quantityInTier;
    
    if (remainingQuantity <= 0) break;
  }

  return cost;
}

function validateInput(type: string, amount: number, quantity: number | undefined) {
  if(type && type === REGISTRATION) return true
  if(type && type === PURCHASE && quantity) return true
  throw Error('INALID_REQUEST')
}

function validatePricing(type: string, amount: number, quantity: number | undefined, pricing: Pricing) {  
  if(type === REGISTRATION) {    
    if((pricing.registration - amount) !== 0) {      
    }    
  } else if( type === PURCHASE) {
    if((amount - calculatePurchasePrice(quantity!, pricing.purchase)) !== 0) {
      throw Error('INVALID_AMOUNT')
    }     
  } else {
    throw Error('INVALID_PAYMENT_TYPE')
  }
}

async function insertData(intentId: string, uid: string, type:string, amount: number, quantity: number) {
  const data = {
    uid: uid,
    type: type,
    amount: amount,
    quantity: quantity,
    timestamp: FieldValue.serverTimestamp()
  }
  console.log('inserting', data)
  return await db.collection('payment').doc(intentId).set(data);
}

async function createPaymentIntent(amount: number, description: string, currency: string) {

  const paymentIntent: Stripe.PaymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: currency,
    description: description
  })  
  console.log('paymentIntent', paymentIntent)
  return paymentIntent
}

interface Tier {
  [quantity: number]: number;
}

interface Pricing {
  currency: string
  registration: number
  purchase: Tier
}