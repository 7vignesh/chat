# ✨ Full Stack Realtime Chat App ✨

Highlights:

- 🌟 Tech stack: MERN + Socket.io + TailwindCSS + Daisy UI
- 🎃 Authentication && Authorization with JWT
- 🔐 Two-Factor Authentication (2FA) with TOTP
- 👾 Real-time messaging with Socket.io
- 🚀 Online user status
- 👌 Global state management with Zustand
- 🐞 Error handling both on the server and on the client
- ⭐ Deployment ready for FREE!
- ⏳ And much more!

### Setup .env file

```js
MONGODB_URI=mongodb://localhost:27017/chat
PORT=5001
JWT_SECRET=your_super_secret_jwt_key_change_this

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

NODE_ENV=development
```

### Running the Backend

Navigate to the backend folder and run:

```shell
npm install
npm run dev
```

The backend will start on `http://localhost:5001`

### Running the Frontend

Navigate to the frontend folder and run:

```shell
npm install
npm run dev
```

The frontend will start on `http://localhost:5173` (or as configured in your Vite setup)

### Build the app

```shell
npm run build
```

### Start the app

```shell
npm start
```

---

## 🔐 Two-Factor Authentication (2FA)

This app includes Two-Factor Authentication using Time-based One-Time Password (TOTP) for enhanced security.

### What is 2FA?

Two-Factor Authentication adds an extra layer of security to your account by requiring a second verification method beyond just your password. This prevents unauthorized access even if someone has your password.

### How to Enable 2FA

#### On the Frontend:

1. Go to **Settings** page
2. Click on **Enable Two-Factor Authentication**
3. A QR code will appear on your screen
4. Scan the QR code with an authenticator app on your phone:
   - **Google Authenticator** (iOS/Android)
   - **Microsoft Authenticator** (iOS/Android)
   - **Authy** (iOS/Android)
5. Enter the 6-digit code from your authenticator app
6. Click **Verify** to enable 2FA

#### On the Backend (API):

**Setup 2FA:**
```
POST /api/auth/2fa/setup
Authorization: Bearer <jwt_token>
```

Response:
```json
{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "qrCode": "data:image/png;base64,iVBORw0KGgo...",
  "message": "Scan the QR code to enable two-factor authentication"
}
```

**Verify 2FA Setup:**
```
POST /api/auth/2fa/verify
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "secret": "JBSWY3DPEBLW64TMMQ======",
  "code": "123456"
}
```

### Login with 2FA

When you have 2FA enabled:

1. **First Step:** Enter your email and password
   ```
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. If 2FA is enabled, you'll get a response asking for 2FA code:
   ```json
   {
     "requiresTwoFactor": true,
     "userId": "65abc123...",
     "message": "Two-factor authentication required"
   }
   ```

3. **Second Step:** Enter the 6-digit code from your authenticator app
   ```
   POST /api/auth/login-2fa
   {
     "userId": "65abc123...",
     "code": "654321"
   }
   ```

4. On success, you'll receive your JWT token and be logged in

### Disable 2FA

To disable 2FA:

```
POST /api/auth/2fa/disable
Authorization: Bearer <jwt_token>
```

On success, you'll be able to log in with just your password.

### 2FA Backend Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|----------------|
| `/api/auth/2fa/setup` | POST | Generate QR code and secret | Yes |
| `/api/auth/2fa/verify` | POST | Verify and enable 2FA | Yes |
| `/api/auth/2fa/disable` | POST | Disable 2FA | Yes |
| `/api/auth/login-2fa` | POST | Complete login with 2FA code | No |

### Important Notes

- ⚠️ **Save your secret key:** If you lose access to your authenticator app, you won't be able to log in. Store your secret key in a safe place.
- ⏱️ **Codes expire quickly:** 2FA codes change every 30 seconds. Use them immediately.
- 🔄 **Sync your device:** Make sure your phone's time is synchronized for codes to work correctly.
- 📱 **Multiple devices:** You can scan the QR code on multiple devices if needed.

### Technologies Used for 2FA

- **Speakeasy:** TOTP token generation and verification
- **QR Code:** For easy authenticator app setup
- **MongoDB:** Secure storage of 2FA secrets

---

## Project Structure

```
chat/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── message.controller.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   └── message.model.js
│   │   ├── routes/
│   │   │   ├── auth.route.js
│   │   │   └── message.route.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   ├── lib/
│   │   │   ├── db.js
│   │   │   ├── socket.js
│   │   │   ├── utils.js
│   │   │   └── cloudinary.js
│   │   └── index.js
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── lib/
│   └── index.html
│
└── README.md
```

---

## License

ISC