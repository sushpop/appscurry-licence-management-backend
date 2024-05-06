import {onCall, HttpsError} from 'firebase-functions/v2/https'
import { CreateRequest, UserRecord, getAuth } from 'firebase-admin/auth'
import type { FirebaseAuthError } from 'firebase-admin/lib/utils/error'
import { initializeApp } from 'firebase-admin/app'


// TODO: Revisit following links: 
// https://firebase.google.com/docs/functions/organize-functions?gen=2nd#index.js
// https://medium.com/@george43g/organise-firebase-functions-part-1-optimize-cold-start-time-cd36f76d2133

// Try to split the functions and code in microservices like features


initializeApp()

export const registerUser = onCall( async (request) => {
  
  // TODO: Have a shared type between frontend and backend?
  const { displayName, email, password } = request.data
  console.info('Request:', request)
  console.info('displayName:', displayName)
  console.info('email:', email)  
  console.info('password:', password)  

  const properties: CreateRequest = {
    displayName: displayName,
    email: email,
    emailVerified: false,
    password: password
  }

  try {
    const userDetails: UserRecord = await getAuth().createUser(properties)  
    //TODO: Disable when migrating to production
    console.log('Show me what you\'ve got :', userDetails)
    return {
      status: "success"
    }

  } catch(error) {
    // TODO: For lack of better support from firebase library on this one as of version 11.11.1, we need following workaround.
    // There is open issue for this: https://github.com/firebase/firebase-admin-node/issues/1666
    // Once it is addressed, Pull the fixed version of firebase-admin sdk and update following code.
    
    if(isFirebaseAuthError(error)) {
      if (error.code === 'auth/email-already-exists') {
        console.error('Account already exists for email: ', email)
        throw new HttpsError('already-exists', 'Email is already registered in the application')
      }
      if (error.code === 'auth/auth/invalid-password') {
        console.error('Password restrictions not followed for email', email)
        throw new HttpsError('invalid-argument', 'Password does not meet the criteria.')
      }         
    }
    // Generic Error
    console.error('Generic error for email:', email, error)
    throw new HttpsError("failed-precondition", "Error creating new user")
  }
})

function isFirebaseAuthError(error: any): error is FirebaseAuthError {
  return (error as FirebaseAuthError).code.startsWith('auth/')
}