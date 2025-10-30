# FitCore - Gym & Fitness Club Management System

FitCore is a complete, serverless management system for gyms and fitness clubs, built with clean HTML, CSS, and JavaScript.

It features a powerful admin panel to manage members, packages, and payments, all powered by Google Firebase for zero server costs.

LIVE DEMO:

Frontend: https://gymone.gt.tc/

Admin Panel: Navigate to the "Admin" link

Admin Secret ID: admin123

# KEY FEATURES:

## Member & Visitor Features

Modern Homepage with Image Gallery

View Membership Packages & Pricing

Online Membership Registration Form

Blood Bank & Notice Board

Team/Trainer Showcase Page

Social Media Links (Facebook/WhatsApp)

## Powerful Admin Panel

Financial Dashboard: View Total Paid & Total Due amounts.

Member Management: Approve pending requests, view all members, and manually add new members.

Payment System: Log member payments and print PDF receipts.

Dues Calculation: Automatically calculates outstanding dues for all members.

Package Creator: Create and manage your membership packages (name, monthly price, features).

Content Control: Manage the homepage gallery, notices, team, and blood donors.

Website Settings: Change the website title, logo, admin password, and social links.

Custom Fields: Add extra fields to the membership registration form.

This system is easy to deploy on any standard web host and requires no backend maintenance.

## FitCore installation guide:

### Step 1: Set Up Your Free Firebase Backend

This is where all your gym's data (members, payments, etc.) will be stored.

#### Create a Firebase Project:
Go to the Firebase Console with your Google account. Click "Add project" and give it a name (e.g., "FitCore Gym").

#### Create a Database:
In your new project, go to Build > Firestore Database. Click "Create database," select Production Mode, and choose a server location.

#### Set Database Rules: 
Go to the Rules tab in Firestore. Delete the existing rules and paste in the following, then click Publish:

rules_version = '2';
service cloud.firestore {
match /databases/{database}/documents {
// This rule allows open read and write access to all documents
// within the public data path for your app. This is necessary
// for the app's features (like public submissions) to work correctly
// without complex user authentication.
match /artifacts/{appId}/public/data/{document=**} {
allow read, write: if true;
}

// You can add more specific rules for other paths here if needed.
// For example, for private user data:
// match /artifacts/{appId}/users/{userId}/{document=**} {
//   allow read, write: if request.auth != null && request.auth.uid == userId;
// }

}
}

#### Enable Authentication:
Go to Build > Authentication. Click "Get started," select Anonymous from the sign-in providers list, enable it, and save.

#### Get Your Config Keys:
Go to your Project Settings (click the ⚙️ icon). In the "Your apps" section, click the web icon (</>), give your app a nickname, and click "Register app." Copy the firebaseConfig object that appears.

### Step 2: Configure Your Code
Open the app.js file in any text editor.

Find the firebaseConfig = { ... } object at the top.

Delete the placeholder object and paste your own firebaseConfig keys that you just copied from Firebase.

Save the app.js file.

### Step 3: Upload to Your Web Host
Log in to your web hosting control panel (like cPanel).

Open the File Manager.

Navigate to the main folder for your website (usually public_html or www).

Upload all three of your files:

index.html

style.css

app.js

### Step 4: First-Time Admin Setup

Visit your live website (e.g., yourgym.com).

Navigate to the Admin page.

Enter the default secret ID: admin123

Once logged in, immediately scroll down to General Settings.

Change the Admin Secret ID to your own secure password.

Update your Website Title, Logo URL, and social media links.

Click Save Settings.

### Step 5: Start Using FitCore!
You are now ready to use the system.

Go to Manage Packages to create your membership plans.

Go to Manage Members to add members manually or approve new requests.

Use the Make a Payment section to log payments and print receipts.

Update your site's content using the Manage Gallery, Manage Notices, and Manage Team sections.
