# IT Inventory System

## Requirements
- Python 3.8+ (already installed)
- Node.js → Download from https://nodejs.org/ (LTS version)

## How to Start

1. Double-click **START.bat**
2. Wait for both servers to start (~30 seconds first time)
3. Browser opens automatically at http://localhost:3000

## How to Use

### Import Data
- Click **"Import Excel"** button (top right)
- Select your SystemInventory.xlsx file
- All data loads into the dashboard

### Search
- Type anything in the search box
- Searches across ALL fields simultaneously

### Edit a System
- Click any row OR click the Edit button
- Change any field
- Click **Save Changes**
- History is automatically recorded

### Export Excel
- Click **"Export Excel"** button
- Downloads formatted .xlsx with all current data
- Button glows blue when there are unsaved changes

### Stats View
- Click **Stats** tab in top bar
- See breakdown by Section and Brand
- View recent change history

## Folder Structure
```
it-inventory/
├── START.bat          ← Run this to start everything
├── backend/
│   ├── main.py        ← FastAPI server
│   ├── requirements.txt
│   └── inventory.db   ← SQLite database (auto-created)
└── frontend/
    ├── src/
    │   └── App.jsx    ← React dashboard
    └── package.json
```

## For IT Team Access (Local Network)
To let other team members access the dashboard:
1. Find your IP: open cmd → type `ipconfig` → note IPv4 address
2. Share this URL with team: `http://YOUR-IP:3000`
3. Make sure firewall allows ports 3000 and 8000
