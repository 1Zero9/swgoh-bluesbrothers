// Prints a fresh VAPID key pair for web push. Run it yourself and paste the three lines into Vercel
// (VAPID_PRIVATE_KEY as a Sensitive variable). Keep the private key out of chats and commits.
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log("VAPID_SUBJECT=mailto:you@example.com   # use a real contact address");
