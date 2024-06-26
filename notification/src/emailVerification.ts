import { onCall } from "firebase-functions/v2/https"
import * as functions from 'firebase-functions/v1'
import { ActionCodeSettings, getAuth } from 'firebase-admin/auth'
import { initializeApp } from "firebase-admin/app"
initializeApp()

import { ServerClient } from 'postmark'
const EMAIL_API_KEY = 'ed22529f-dfc2-4102-9323-f706b95ad444'
var client = new ServerClient(EMAIL_API_KEY)

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

async function sendEmail(userEmail: string, username: string, link: string) {

  try {
    const response = await client.sendEmailWithTemplate({
      "From": "sushpop@appscurry.com",
      "To": userEmail,
      "TemplateId": 36373166,
      "TemplateAlias": 'welcome',
      "TemplateModel": {
        "name": username,
        "product_name": "SnorelabPro",
        "action_url": link        
      }
    })
    return response
  } catch(error) {
    // Generic Error
      console.error('Error sending email:', error)  
      throw new Error()
  }
}