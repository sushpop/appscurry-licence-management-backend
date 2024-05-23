import { onCall } from "firebase-functions/v2/https"
import * as functions from 'firebase-functions/v1'
import { ActionCodeSettings, getAuth } from 'firebase-admin/auth'
import { initializeApp } from "firebase-admin/app"

import { MailtrapClient } from 'mailtrap'

initializeApp()

const actionCodeSettings = {
  url: 'https://appscurry-licence-management.web.app/authenticate'
} 

// V2 invoke from Frontend
export const initiateEmailVerification = onCall( async (request) => {

  const email = request.auth?.token.email!
  const displayName = request.auth?.token.name!
  console.log('Re-Triggering email for user:', email)
  try {           
    await generateAndPublishVerificationEmail(email, displayName, actionCodeSettings)
    return {
      status: "success"
    }
  } catch(error) {
    console.error('Failed to send verification email to:', email, error)
    return {
      status: "error"
    }
  }

})

// V1 just for Auth trigger
export const autoInitiateEmailVerification = functions.auth.user().onCreate(async (user) => {    
  
  const displayName = user.displayName!
  const email = user.email!
  
  console.log('Triggering email for user:', email)
  try {           
    await generateAndPublishVerificationEmail(email, displayName, actionCodeSettings)
    return {
      status: "success"
    }

  } catch(error) {
    console.error('Failed to send verification email to:', email, error)
    return {
      status: "error"
    }
  }
})

async function generateAndPublishVerificationEmail(email: string, displayName: string, actionCodeSettings: ActionCodeSettings) {
  
  const verificationLink = await getAuth().generateEmailVerificationLink(email, actionCodeSettings)
  console.log('verificationLink:', verificationLink)
    
  // TODO: DELETE OR MOVE THIS FROM HERE .. THIS IS ONLY FOR DEBUGGING PURPOSE
  const passwordResetLink = await getAuth().generatePasswordResetLink(email, actionCodeSettings)
  console.log('passwordResetLink:', passwordResetLink)

  // const changeEmailLink = await getAuth().generateVerifyAndChangeEmailLink(email, 'sushant.pophli@gmail.com', actionCodeSettings)
  // console.log('changeEmailLink:', changeEmailLink)    

  await sendEmail(email, displayName, verificationLink)
    
}

async function sendEmail(userEmail: string, username: string | undefined, link: string) {

  const TOKEN = "12b856e48f8baa425115a37a9a247e59";

  const client = new MailtrapClient({ token: TOKEN });

  const sender = {
    email: "mailtrap@demomailtrap.com",
    name: "Mailtrap Test",
  };
  const recipients = [
    {
      email: userEmail,
    }
  ];

 try {
  const response = await client
  .send({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Hi, Congrats for sending test email with Mailtrap!" + "\n" + link,
    category: "Integration Test",
  })
  return response
  } catch(error) {
  // Generic Error
    console.error('Error sending email:', error)  
    throw new Error()
  }
}
