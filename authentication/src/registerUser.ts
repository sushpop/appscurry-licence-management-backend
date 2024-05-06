import {onCall, HttpsError} from 'firebase-functions/v2/https'
import { CreateRequest, UserRecord, getAuth } from 'firebase-admin/auth'
import type { FirebaseAuthError } from 'firebase-admin/lib/utils/error'
import { initializeApp } from 'firebase-admin/app'

initializeApp()

export const registerUser = onCall( async (request) => {
  
  const { displayName, email, password } = request.data
  console.info('Registering user with email:', email)   
  
  const properties: CreateRequest = {
    displayName: displayName,
    email: email,
    emailVerified: false,
    password: password
  }

  try {
    const userDetails: UserRecord = await getAuth().createUser(properties)      
    console.log('User created with email:', userDetails)
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
        console.error('Password restrictions not followed for email:', email)
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