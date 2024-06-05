import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
initializeApp();
const DB_NAME = "appscurry-licence-management"
const db = getFirestore(DB_NAME)
db.settings({ ignoreUndefinedProperties: true }); // ignores undefined peroperties during serializtion

const stripe = require("stripe")('sk_test_51PC49AJnK8YalHcBQrlAcRZFwWlvPFAoA7ASM9b0Mn97hXUZGVoOO3hHDPEZTHhHb7qR92XvsNWIuhTEwwKymI0I00qQEXKR3B');

// 2 Types of payment Events: REGISTRATION and PURCHASE
const REGISTRATION: string = 'registration'
const PURCHASE: string = 'purchase'
const SUMMARY = 'summary'
const LINE_ITEM = 'line_item'

interface Tier {
  [quantity: number]: number;
}

interface Pricing {
  currency: string
  registration: number
  purchase: Tier
}

interface PaymentInitiated {
  amount: number
  type: string
  uid: string
  quantity: number
  timestamp: FieldValue
}

interface SummaryDocument {
  total: FieldValue
  docType: string
}

interface CustomerPayment {
  amount: number
  type: string
  quantity: number
  receiptUrl: string
  status: string
  createTime: FieldValue
  docType: string
  receiptNumber: string | undefined
  slReceiptUrl: string | undefined
}

export { db, stripe, Pricing, Tier, PaymentInitiated, SummaryDocument, CustomerPayment,  REGISTRATION, PURCHASE, SUMMARY, LINE_ITEM, DB_NAME }


