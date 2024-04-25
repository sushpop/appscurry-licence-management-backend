/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, onRequest } from "firebase-functions/v2/https"
import * as logger from "firebase-functions/logger"
import { MailtrapClient, SendResponse } from 'mailtrap'
import * as functions from 'firebase-functions/v1'

import { getAuth } from 'firebase-admin/auth'

import * as crypto  from 'crypto';
import { initializeApp } from "firebase-admin/app"


// TODO: Move this to env
const SECRET_KEY = 'very_strong_secret_key_here'; 

initializeApp()

// TODO
export const initiateEmailVerification = onCall( async (request) => {

  // 1. Extract userId from request
  // 2. fetch email id from auth
  // 3. generate token
  // 4. fire email
  logger.info("Hello logs..!", {structuredData: true});

  // TODO: Have a shared type between frontend and backend?
  // TODO: Do not have a displayName yet on the first screen, I guess we should have it
  const { email, displayName } = request.data  
  console.info('email:', email)  
  console.info('displayName:', displayName)  
  

  try {
    const mailSend: SendResponse = await sendEmail(email, displayName)
    mailSend.message_ids
    return {
      status: "success"
    }
  }  catch(error) {
    console.log("error while sending verification mail to ", email, error)
    return {
      status: "failure"
    }
  }

})

// V1 just for Auth trigger - DONE
export const autoInitiateEmailVerification = functions.auth.user().onCreate(async (user) => {    
  
  const userId = user.uid
  // TODO: Do not have a displayName yet on the first screen, I guess we should have it
  const displayName = user.displayName

  // TODO: remove hardcoding
  // const email = user.email!
  const email = 'sushpop@gmail.com';
  console.log('Triggering email for user:', user.email!)
  try {
    const secureToken = generateVerificationToken(userId)
    console.log('Token: ', secureToken, 'for userId:', userId)
    const mailSend = await sendEmail(email, displayName)
    return mailSend
  }  catch(error) {
    return error
  }
    
})

// DONE
export const verifyEmail = onCall( async (request) => {

  const { token } = request.data
  const { isVerified, uid } = verifyToken(token)

  if(isVerified) {
    // update email flag on user
    await getAuth().updateUser(uid, { emailVerified:true })
    return {
      status: 'success'
    }
  } else {
    //return error
    return {
      status: 'error'
    }
  }
})

// ForTest
export const verifyEmailTest = onRequest( async (request, response) => {
  
  const token = request.param('token')
  const { isVerified, uid } = verifyToken(token)

  if(isVerified) {
    // update email flag on user
    await getAuth().updateUser(uid, { emailVerified:true })
    response.send('success')
  } else {
    //return error
    response.send('error')
  }
})

function generateVerificationToken(userId: string) {
  // Encode user ID (replace with more robust encoding if needed)
  const encodedUserId = Buffer.from(userId.toString()).toString('base64');

  // Create a signing object using HMAC-SHA256 algorithm
  const hmac = crypto.createHmac('sha256', SECRET_KEY);

  // Update the hmac object with the encoded user ID
  hmac.update(encodedUserId);
  console.log('using encodedUserId', encodedUserId)

  // Generate the signature
  const signature = hmac.digest('hex');

  // Combine encoded user ID and signature (URL-encode for safety)
  const token = `${encodeURIComponent(encodedUserId)}.${encodeURIComponent(signature)}`;
  
  return token;
}

function verifyToken(token: string) {
  // Split the token into encoded user ID and signature
  const [encodedUserId, signature] = token.split('.');

  // Decode the encoded user ID (replace with actual decoding if needed)
  const decodedUserId = Buffer.from(decodeURIComponent(encodedUserId), 'base64').toString();
  console.log('decodedUserId', decodedUserId)
  
  // Create a new hmac object with the same algorithm and secret key
  const hmac = crypto.createHmac('sha256', SECRET_KEY);

  // Update the hmac object with the encoded userId
  hmac.update(encodedUserId);
  console.log('using encodedUserId', encodedUserId)

  // Generate the expected signature
  const expectedSignature = hmac.digest('hex');

  // Verify if the provided signature matches the expected one
  console.log('expected:', expectedSignature)
  console.log('actual:', signature)
  return {
    isVerified: (signature === expectedSignature),
    uid: decodedUserId
  }
}

// email sender integration
// username -> make it mandatory when UI is changed
async function sendEmail(userEmail: string, username: string | undefined) {

  const TOKEN = "12b856e48f8baa425115a37a9a247e59";

  const client = new MailtrapClient({ token: TOKEN });

  const sender = {
    email: "mailtrap@demomailtrap.com",
    name: "Mailtrap Test",
  };
  const recipients = [
    {
      // TODO: Toggle following lines
      // email: userEmail
      email: userEmail,
    }
  ];

 try {
  const response = await client
  .send({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  return response
  } catch(error) {
  // Generic Error
    console.error('Error sending email:', error)  
    throw new Error()
  }
}
