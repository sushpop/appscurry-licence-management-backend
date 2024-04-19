import {onCall, HttpsError} from 'firebase-functions/v2/https'
import { DecodedIdToken, getAuth } from 'firebase-admin/auth'

// TODO: Initialize app is called somewhere else, need to dig more on finding a place for this.
// initializeApp()

export const validateToken = onCall( async (request) => {
  
  // TODO: Have a shared type between frontend and backend?
  const inputToken: any = request.data
  console.info('Request:', request)
  console.info('Request data: ', request.data)

  try {
    const decodedToken: DecodedIdToken = await getAuth().verifyIdToken(inputToken)
    //TODO: Disable when migrating to production
    console.log('Show me what you\'ve got :', decodedToken)
    console.log('userId :', decodedToken.uid)
    return {
      status: "success"
    }
  } catch(error) {
    // Generic Error
    console.error('Generic error:', error)
    throw new HttpsError("failed-precondition", "Token Verification failed")
  }
})