# Railway Deployment Fix

## Problem
Railway is showing "Venice AI Multi-Chat" instead of "LyricLens"

## Solution
Railway is connected to the wrong GitHub repository.

## Steps to Fix

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select your project** (the one with domain `lyriclens.up.railway.app`)
3. **Settings → Source**
4. **Check connected repository** - it's probably pointing to a "Multi-Chat" repo
5. **Change source repository**:
   - Disconnect current repo
   - Connect to: `vivmuk/LyricLens`
   - Branch: `main`
6. **Redeploy** - Railway will automatically detect the new source and deploy

## Verify Correct Repository
- Repository: `https://github.com/vivmuk/LyricLens.git`
- Branch: `main`
- Should see files like:
  - `src/app/page.tsx` (with "LyricLens" title)
  - `src/components/Dashboard.tsx`
  - `railway.json`

## Environment Variables Required
Make sure these are set in Railway:
- `VENICE_API_KEY`: `lnWNeSg0pA_rQUooNpbfpPDBaj2vJnWol5WqKWrIEF`

After reconnecting, Railway will rebuild and deploy the correct LyricLens app!

