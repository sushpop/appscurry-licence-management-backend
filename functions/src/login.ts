import {onCall, HttpsError} from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions/v2'
import { UserCredential, getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { initializeApp, FirebaseError } from 'firebase/app'


const app = initializeApp({
  apiKey: "AIzaSyCMx7Z8CGMXbmNtgTePmXxLuF8F68zj4fs",
  authDomain: "appscurry-licence-management.firebaseapp.com",
  projectId: "appscurry-licence-management",
});

export const login = onCall( async (request) => {
  
  // TODO: Have a shared type between frontend and backend?
  const { email, password } = request.data;
  logger.info('email:', email)  
  logger.info('password:', password)

  try {
    const userDetails: UserCredential = await signInWithEmailAndPassword(getAuth(app), email, password)
    
    const token: string = await userDetails.user.getIdToken()
    const uid: string = userDetails.user.uid
    const displayName: any  = userDetails.user.displayName
    const isEmailVerified: boolean = userDetails.user.emailVerified    
    
    //TODO: Disable when migrating to production   
    console.debug('Show me what you\'ve got :', uid, displayName, isEmailVerified, token);

    return {
      status: 'success',
      message: 'Login Success',
      data : {
        idToken: token,
        uid: uid,
        displayName: displayName,
        email: email,
        emailVerified: isEmailVerified
      }      
    }
  } catch(error) {

    if(error instanceof FirebaseError) {
      const firebaseError = error as FirebaseError
      if (firebaseError.code === 'auth/invalid-credential') {
        logger.error('Invalid Credentials for email: ', email)
        throw new HttpsError('invalid-argument', 'Invalid Credentials')
      }
    }
    // Generic Error
    console.error('Generic error for email:', email, error)
    throw new HttpsError("failed-precondition", "Failed to login")
  }
})