# F1 Telemetry Visualizer

A web app for visualizing F1 qualifying telemetry — track maps, mini-sector breakdowns, and driver comparisons for the 2026 season.

---

## Step 1 — Install Node.js (first time only)

Node.js is the runtime that powers the development server.

1. Go to **https://nodejs.org/en/download**
2. Download the **LTS** version for macOS
3. Open the downloaded `.pkg` file and follow the installer steps
4. When the installer finishes, open **Terminal** (press `Cmd + Space`, type `Terminal`, press Enter)
5. Verify the installation by running these two commands one at a time:

```bash
node --version
```
Expected output: `v18.x.x` or higher

```bash
npm --version
```
Expected output: `9.x.x` or higher

---

## Step 2 — Install project dependencies (first time only)

This downloads all the libraries the app needs. You only do this once.

1. Open **Terminal**
2. Run this command to navigate to the app folder:

```bash
cd "/Users/alancai/Desktop/F1 Website Thing With Keji/app"
```

3. Run:

```bash
npm install
```

Wait for it to finish. You will see a line like `added 123 packages` when it's done.

---

## Step 3 — Start the development server

Do this every time you want to run the website.

1. Open **Terminal**
2. Run:

```bash
cd "/Users/alancai/Desktop/F1 Website Thing With Keji/app"
```

3. Run:

```bash
npm run dev -- --port 5180
```

4. Wait until you see this in the terminal:

```
VITE ready in xxx ms

➜  Local:   http://localhost:5180/
```

5. Open your browser (Chrome, Safari, Firefox — any works) and go to:

**http://localhost:5180**

The app is now running. **Do not close the Terminal window** — closing it stops the server.

---

## Step 4 — Stop the server

When you are done, go back to the Terminal window and press:

```
Ctrl + C
```

---

## Adding new circuit data (when Keji provides CSV files)

1. Place the CSV files in this folder (replace `{circuit}` with the circuit name, e.g. `monaco`):

```
/Users/alancai/Desktop/F1 Website Thing With Keji/Keji/FastF1 Data/fastf1_2026_{circuit}_grand_prix/qualifying/telemetry_fastest_laps/
```

For example, for Monaco the folder path is:

```
/Users/alancai/Desktop/F1 Website Thing With Keji/Keji/FastF1 Data/fastf1_2026_monaco_grand_prix/qualifying/telemetry_fastest_laps/
```

2. Open this file in any text editor:

```
/Users/alancai/Desktop/F1 Website Thing With Keji/app/src/lib/dataIndex.ts
```

3. Find the line for that circuit. It will look like this:

```
{ id: 'monaco', name: 'Monaco GP', flag: '🇲🇨', raceDate: '2026-06-07', hasData: false, sessions: stdSessions },
```

4. Change `hasData: false` to `hasData: true` and save the file.

5. Reload **http://localhost:5180** in your browser — the full animated telemetry visualization will appear automatically.

---

## Sharing the project (Google Drive / sending to someone)

**Do not upload the raw project folder to Google Drive.** The `node_modules` folder inside `app/` contains thousands of files including symbolic links (`.bin` files) that Google Drive cannot sync and will throw errors on.

Instead, create a zip that excludes those folders. Open Terminal and run:

```bash
cd "/Users/alancai/Desktop"
zip -r "F1_Project.zip" "F1 Website Thing With Keji" \
  --exclude "*/node_modules/*" \
  --exclude "*/.git/*" \
  --exclude "*/dist/*" \
  --exclude "*/__pycache__/*" \
  --exclude "*.pyc"
```

This creates `F1_Project.zip` on your Desktop (around 350 MB). Upload that file to Google Drive — no errors.

**When someone receives the zip:**

1. Unzip it
2. Follow Step 1 and Step 2 of this README to install Node.js and run `npm install`
3. Then follow Step 3 to start the server

---

## Circuit IDs reference

| Circuit | ID to use in dataIndex.ts |
|---|---|
| Monaco | `monaco` |
| Barcelona-Catalunya | `barcelona_catalunya` |
| Austrian (Red Bull Ring) | `austrian` |
| British (Silverstone) | `british` |
| Belgian (Spa) | `belgian` |
| Hungarian (Hungaroring) | `hungarian` |
| Dutch (Zandvoort) | `dutch` |
| Italian (Monza) | `italian` |
| Madrid | `madrid` |
| Azerbaijan (Baku) | `azerbaijan` |
| Singapore | `singapore` |
| United States (COTA) | `united_states` |
| Mexico City | `mexican_city` |
| São Paulo (Interlagos) | `sao_paulo` |
| Las Vegas | `las_vegas` |
| Qatar (Lusail) | `qatar` |
| Abu Dhabi (Yas Marina) | `abu_dhabi` |
