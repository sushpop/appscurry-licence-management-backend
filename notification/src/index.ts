import { initiateEmailVerification, autoInitiateEmailVerification, verifyEmail, verifyEmailTest } from './emailVerification'
exports.verifyEmail = verifyEmail
exports.initiateEmailVerification = initiateEmailVerification
exports.autoInitiateEmailVerification = autoInitiateEmailVerification
exports.verifyEmailTest = verifyEmailTest


// TODO: Revisit following links: 
// https://firebase.google.com/docs/functions/organize-functions?gen=2nd#index.js
// https://medium.com/@george43g/organise-firebase-functions-part-1-optimize-cold-start-time-cd36f76d2133
// Try to split the functions and code in microservices like features
