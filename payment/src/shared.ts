import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
initializeApp();
const db = getFirestore("appscurry-licence-management")
db.settings({ ignoreUndefinedProperties: true }); // ignores undefined peroperties during serializtion

const stripe = require("stripe")('sk_test_51PC49AJnK8YalHcBQrlAcRZFwWlvPFAoA7ASM9b0Mn97hXUZGVoOO3hHDPEZTHhHb7qR92XvsNWIuhTEwwKymI0I00qQEXKR3B');

// 2 Types of payment Events: REGISTRATION and PURCHASE
const REGISTRATION: string = 'registration'
const PURCHASE: string = 'purchase'

export { db, stripe, REGISTRATION, PURCHASE }


