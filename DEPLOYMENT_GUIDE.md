# Windows Server Deployment Guide (24/7 Live)

This guide explains how to deploy the **CyberShield / OGDCL Cybersecurity Platform** on a Windows Server so that it runs continuously 24/7 without interruption.

---

## 1. Prerequisites on the Windows Server

1. **Install Node.js (LTS version)**:
   - Download the Windows Installer (.msi) from [https://nodejs.org](https://nodejs.org) (v20.x or v22.x LTS recommended).
   - Complete the installation wizard (keep default options checked).
   - Verify by opening PowerShell or Command Prompt:
     ```powershell
     node -v
     npm -v
     ```

2. **Copy the Project to the Server**:
   - Copy this entire project directory to your desired location on the server, e.g.:
     `C:\Apps\Cyber-Activity-OGDCL`

---

## 2. Quick Test (Manual Run)

1. Open PowerShell or Command Prompt inside the project folder:
   ```powershell
   cd C:\Apps\Cyber-Activity-OGDCL
   npm install
   npm start
   ```
2. You will see:
   ```text
   ========================================================
   🚀 CyberShield Server is LIVE and Running!
   👉 Local:   http://localhost:3000
   👉 Network: http://192.168.x.x:3000
   ========================================================
   ```
3. Test it in your browser at `http://localhost:3000`.

---

## 3. Keep it Live 24/7 as a Windows Service (Automated)

To ensure the server never stops—even if you log out of the server or the server restarts after Windows updates:

### Automated Method:
Right-click on **`install-windows-service.bat`** and select **"Run as Administrator"**.

### Manual Method (via PowerShell / CMD as Administrator):
```powershell
# 1. Install PM2 and Windows startup tool globally
npm install -g pm2 pm2-windows-startup

# 2. Register PM2 with Windows boot
pm2-startup install

# 3. Start the server under PM2
cd C:\Apps\Cyber-Activity-OGDCL
pm2 start server.js --name "cybershield"

# 4. Save the running process list so it automatically restarts on reboot
pm2 save
```

### Useful Management Commands:
- **Check Status**: `pm2 status`
- **View Live Logs**: `pm2 logs cybershield`
- **Restart Application**: `pm2 restart cybershield`
- **Stop Application**: `pm2 stop cybershield`

---

## 4. Change Port to Standard HTTP Port 80 (Optional)

By default, the server runs on port **3000**.
If you want users to just type `http://<SERVER-IP>` without specifying `:3000`:
- Set the environment variable `PORT=80` before starting:
  ```powershell
  set PORT=80
  pm2 restart cybershield --update-env
  ```
  *(Note: Ensure Port 80 is not already occupied by IIS or Skype. If IIS is installed, you can use IIS as a Reverse Proxy).*

---

## 5. Allow Incoming Traffic in Windows Firewall

To allow users across your company's network / intranet to access the website:

1. Open PowerShell **as Administrator** on the Windows Server.
2. Run this command to open the firewall port:
   ```powershell
   New-NetFirewallRule -DisplayName "CyberShield Web Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```
   *(If you are using Port 80, replace `3000` with `80`)*.

---

## 6. Accessing the Website

Employees can access the site from any computer on your network using:
- **By IP Address**: `http://<SERVER_IP>:3000` (e.g., `http://10.144.27.93:3000`)
- **By Server Hostname**: `http://<SERVER_NAME>:3000`
- **By Corporate Domain** *(if configured in DNS/Active Directory)*: `http://cyberawareness.ogdcl.local`
