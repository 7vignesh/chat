import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { Send, Shield, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  {
    id: 2,
    content: "I'm doing great! Just working on some new features.",
    isSent: true,
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { authUser, setup2FA, verify2FA, disable2FA } = useAuthStore();

  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  const handleSetup2FA = async () => {
    setIsLoading(true);
    const data = await setup2FA();
    if (data) {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setShowSetup(true);
    }
    setIsLoading(false);
  };

  const handleVerify2FA = async () => {
    if (verifyCode.length !== 6) return;
    setIsLoading(true);
    await verify2FA(secret, verifyCode);
    setShowSetup(false);
    setQrCode(null);
    setSecret(null);
    setVerifyCode("");
    setIsLoading(false);
  };

  const handleDisable2FA = async () => {
    setIsLoading(true);
    await disable2FA();
    setIsLoading(false);
  };

  return (
    <div className="h-screen container mx-auto px-4 pt-20 max-w-5xl">
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Theme</h2>
          <p className="text-sm text-base-content/70">
            Choose a theme for your chat interface
          </p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
              `}
              onClick={() => setTheme(t)}
            >
              <div
                className="relative h-8 w-full rounded-md overflow-hidden"
                data-theme={t}
              >
                <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                  <div className="rounded bg-primary"></div>
                  <div className="rounded bg-secondary"></div>
                  <div className="rounded bg-accent"></div>
                  <div className="rounded bg-neutral"></div>
                </div>
              </div>
              <span className="text-[11px] font-medium truncate w-full text-center">
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </span>
            </button>
          ))}
        </div>

        {/* 2FA Section */}
        <div className="flex flex-col gap-1 mt-6">
          <h2 className="text-lg font-semibold">Two-Factor Authentication</h2>
          <p className="text-sm text-base-content/70">
            Add an extra layer of security to your account
          </p>
        </div>

        <div className="bg-base-200 rounded-xl p-6 space-y-4">
          {/* 2FA Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {authUser?.isTwoFactorEnabled ? (
                <ShieldCheck className="w-8 h-8 text-success" />
              ) : (
                <Shield className="w-8 h-8 text-base-content/40" />
              )}
              <div>
                <p className="font-medium">
                  {authUser?.isTwoFactorEnabled
                    ? "2FA Enabled"
                    : "2FA Disabled"}
                </p>
                <p className="text-sm text-base-content/60">
                  {authUser?.isTwoFactorEnabled
                    ? "Your account is protected with two-factor authentication"
                    : "Enable 2FA to secure your account"}
                </p>
              </div>
            </div>

            {/* Enable / Disable Button */}
            {!authUser?.isTwoFactorEnabled ? (
              <button
                className="btn btn-primary"
                onClick={handleSetup2FA}
                disabled={isLoading || showSetup}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Enable 2FA"
                )}
              </button>
            ) : (
              <button
                className="btn btn-error btn-outline"
                onClick={handleDisable2FA}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4" />
                    Disable 2FA
                  </>
                )}
              </button>
            )}
          </div>

          {/* QR Code Setup */}
          {showSetup && qrCode && (
            <div className="border border-base-300 rounded-xl p-6 space-y-4 bg-base-100">
              <h3 className="font-semibold text-center">Scan QR Code</h3>
              <p className="text-sm text-base-content/60 text-center">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.)
              </p>

              {/* QR Code Image */}
              <div className="flex justify-center">
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              {/* Manual Secret Key */}
              <div className="text-center">
                <p className="text-xs text-base-content/50 mb-1">
                  Or enter this key manually:
                </p>
                <code className="text-xs bg-base-200 px-3 py-1 rounded-lg break-all">
                  {secret}
                </code>
              </div>

              {/* Verify Code Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Enter the 6-digit code from your authenticator app to confirm:
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  className="input input-bordered w-full text-center text-2xl tracking-widest"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  className="btn btn-outline flex-1"
                  onClick={() => {
                    setShowSetup(false);
                    setQrCode(null);
                    setSecret(null);
                    setVerifyCode("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleVerify2FA}
                  disabled={verifyCode.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify & Enable"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
