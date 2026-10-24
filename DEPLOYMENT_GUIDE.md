# Windows Server Offline Deployment Guide (PostgreSQL Local Database)

This guide walks you through setting up the **CyberShield / OGDCL Cybersecurity Platform** on a completely offline Windows Server with a brand new local **PostgreSQL** database.

---

## ⚠️ CRITICAL NOTICE FOR OFFLINE SERVERS (NO INTERNET)

1. **Do NOT run `npm install` on the offline server** (npm requires internet).
2. **Copy this entire project folder WITH `node_modules`** from your internet-connected computer to the offline server.
   - `node_modules` has already been installed in this folder.
   - Simply copy the folder (e.g. `website1-main`) onto a USB drive or local network share, and paste it onto the server (e.g. `C:\Apps\CyberShield`).

---

## Part 1: Installing PostgreSQL on Windows Server

You have `postgresql-18.x-windows-x64.exe` (or v16 / v17):

1. **Run the PostgreSQL Installer as Administrator**:
   - Double-click the installer `postgresql-18.x-windows-x64.exe`.
2. **Components Selection**:
   - Keep default selections checked:
     - ✅ **PostgreSQL Server**
     - ✅ **pgAdmin 4** (GUI management tool)
     - ✅ **Command Line Tools**
3. **Password Configuration (IMPORTANT)**:
   - When asked for the password for the `postgres` superuser, enter a password (for example: `postgres` or your company server password).
   - **Write this password down!** You will need it in your `.env` file.
4. **Port**:
   - Keep default port `5432`.
5. **Finish**:
   - At the final screen, **UNCHECK "Stack Builder"** (Stack Builder attempts to download extra add-ons from the internet, which will fail offline).
   - Click **Finish**.

PostgreSQL is now installed and running in the background as a Windows Service (`postgresql-x64-...`).

---

## Part 2: Create the `cybershield` Database

You can do this using **pgAdmin 4** (GUI) or **Command Prompt**:

### Method A: Using pgAdmin 4 (Easiest)
1. Open **pgAdmin 4** from your Windows Start Menu.
2. Enter your master password (set during install).
3. Expand **Servers** -> Click **PostgreSQL 18** (or 16/17) -> Enter your `postgres` password.
4. Right-click on **Databases** -> **Create** -> **Database...**
5. In the **Database** field, type:
   ```text
   cybershield
   ```
6. Click **Save**.

### Method B: Using Command Line (Fastest)
Open Command Prompt / PowerShell as Administrator and run:
```cmd
"C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres cybershield
```
*(Enter your password when prompted).*

---

## Part 3: Configure Project Connection (`.env`)

1. Open the project folder on the server.
2. Open the file [`.env`](file:///d:/Desktop/website1-main/website1-main/.env) in Notepad.
3. Verify or update the `DATABASE_URL` line with your actual PostgreSQL password:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cybershield
   PORT=3000
   ```
   *(Replace `YOUR_PASSWORD` with the password you chose in Part 1).*
4. Save and close the file.

---

## Part 4: Run Database Schema & Migrations

We provided an automated 1-click script that creates the tables, indexes, and default settings:

### Option A: One-Click Setup Script (Recommended)
1. Double-click **[`setup-db.bat`](file:///d:/Desktop/website1-main/website1-main/setup-db.bat)** inside the project directory.
2. You will see:
   ```text
   ============================================================
   🛡️ CyberShield Local Database Setup Tool
   ============================================================
   ✅ Connected successfully!
   ✅ Table "public.users" created/verified.
   ✅ Indexes "idx_users_score" & "idx_users_createdat" ready.
   ✅ Table "public.site_settings" created/verified.
   ✅ Default settings seeded (All activities unlocked).
   ✅ Seeded sample employee record for Admin Dashboard preview.
   🎉 Database setup completed successfully!
   ```

### Option B: Manual SQL Execution in pgAdmin 4
If you prefer running SQL manually:
1. In pgAdmin 4, right-click on the database **`cybershield`**.
2. Click **Query Tool**.
3. Open or paste the contents of **[`schema-postgres-local.sql`](file:///d:/Desktop/website1-main/website1-main/schema-postgres-local.sql)**.
4. Press **F5** (or click the ▶️ Execute button).

---

## Part 5: Starting the CyberShield Server

### Quick Start (Double Click):
- Double-click **[`start-server.bat`](file:///d:/Desktop/website1-main/website1-main/start-server.bat)**.
- The command window will display:
  ```text
  ========================================================
  🚀 CyberShield Server is LIVE and Running!
  👉 Local:   http://localhost:3000
  👉 Network: http://192.168.x.x:3000
  ========================================================
  ```
- Open `http://localhost:3000` in Google Chrome or Edge.

---

## Part 6: Allow Intranet / Network Access in Windows Firewall

To let other computers on your corporate network access the website:

1. Open **PowerShell as Administrator** on the Windows Server.
2. Run this command:
   ```powershell
   New-NetFirewallRule -DisplayName "CyberShield Web Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```
3. Users across the network can now open:
   ```text
   http://<SERVER-IP-ADDRESS>:3000
   ```
   (e.g., `http://10.144.27.93:3000`)

---

## Part 7: Keep Server Running 24/7 (NSSM Windows Service)

Because NSSM (Non-Sucking Service Manager) is installed on your server, you can run CyberShield as a true, enterprise-grade Windows Service (`services.msc`):

1. **One-Click Installation**:
   - Right-click on **[`install-windows-service.bat`](file:///d:/Desktop/website1-main/website1-main/install-windows-service.bat)** and choose **"Run as Administrator"**.
   - The script automatically locates `nssm.exe` and `node.exe`, registers a Windows Service named **`CyberShield`**, enables automatic recovery/restart upon crashes, sets up log rotation (`service-out.log`), and starts the service immediately.

2. **Managing the Service**:
   - **View in Windows**: Open `services.msc` (look for **CyberShield Platform Service**).
   - **Start Service**: `nssm start CyberShield`
   - **Stop Service**: `nssm stop CyberShield` (or double-click `stop-server.bat`)
   - **Restart Service**: `nssm restart CyberShield`
   - **Uninstall Service**: Right-click **[`uninstall-windows-service.bat`](file:///d:/Desktop/website1-main/website1-main/uninstall-windows-service.bat)** ➔ Run as Administrator.

---

## Summary of Key Files
- [`.env`](file:///d:/Desktop/website1-main/website1-main/.env): Stores your local database connection password and server port.
- [`setup-db.bat`](file:///d:/Desktop/website1-main/website1-main/setup-db.bat): 1-click database creator and schema runner.
- [`schema-postgres-local.sql`](file:///d:/Desktop/website1-main/website1-main/schema-postgres-local.sql): Pure PostgreSQL script for `users` and `site_settings`.
- [`start-server.bat`](file:///d:/Desktop/website1-main/website1-main/start-server.bat): 1-click server runner.
