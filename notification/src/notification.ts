/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { MailtrapClient, SendResponse } from 'mailtrap';
// import * as functions from 'firebase-functions/v1';


// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest( async (request, response) => {
  logger.info("Hello logs..!", {structuredData: true});
  response.send("Hello from Firebase! - notification powered by sendGrid, Not!!");
  
  const TOKEN = "12b856e48f8baa425115a37a9a247e59";
  // const ENDPOINT = "https://send.api.mailtrap.io/";

  const client = new MailtrapClient({ token: TOKEN });

  const sender = {
    email: "mailtrap@demomailtrap.com",
    name: "Mailtrap Test",
  };
  const recipients = [
    {
      email: "sushant.pophli@gmail.com",
    }
  ];

  const mailClientResponse: SendResponse = await client
    .send({
      from: sender,
      to: recipients,
      subject: "You are awesome!",
      text: "Congrats for sending test email with Mailtrap!",
      category: "Integration Test",
    })

    console.log('response', mailClientResponse)
    // .then(console.log, console.error);
  });


  // exports.sendWelcomeEmail = functions.auth.user().onCreate((user) => {    
  //   const email = user.email; // The email of the user.
  //   const displayName = user.displayName; // The display name of the user.
  //   // ...
  // });