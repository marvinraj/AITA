# 🔧 Google Places API Setup Guide

## � Fixing "REQUEST_DENIED" Error

The logs show `REQUEST_DENIED` status, which means the Google Places API is rejecting requests. Here's how to fix it:

### **Step 1: Check Your Environment Variable**
The service expects: `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY`

```bash
# Add to your .env file or environment
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

### **Step 2: Google Cloud Console Setup**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create or select a project**
3. **Enable the Places API:**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Places API" 
   - Click "ENABLE"

4. **Create an API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

5. **Enable Billing (REQUIRED):**
   - Go to "Billing" in the left menu
   - Set up a billing account
   - **Note**: Places API requires billing to be enabled, even for free tier usage

### **Step 3: Configure API Key Restrictions (Recommended)**

1. **In Google Cloud Console:**
   - Go to "APIs & Services" > "Credentials"
   - Click on your API key
   - Under "API restrictions" > "Restrict key"
   - Select only "Places API"

2. **Optional - Application Restrictions:**
   - For mobile apps, you can add bundle ID restrictions
   - For development, you can temporarily use "None"

### **Step 4: Verify Your Setup**

```bash
# Test your API key with a simple request
curl "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=restaurant&inputtype=textquery&fields=place_id,photos&key=YOUR_API_KEY"
```

Expected response: `{"status": "OK", "candidates": [...]}`

### **Step 5: Common Issues & Solutions**

#### **❌ REQUEST_DENIED**
- **Cause**: API key invalid, not set, or API not enabled
- **Solution**: Follow steps 1-3 above

#### **❌ OVER_QUERY_LIMIT** 
- **Cause**: Exceeded daily quota or rate limits
- **Solution**: Check quotas in Google Cloud Console, increase if needed

#### **❌ INVALID_REQUEST**
- **Cause**: Malformed request parameters
- **Solution**: Check URL encoding and required fields

#### **❌ ZERO_RESULTS**
- **Cause**: No places found (not an error, just no photos)
- **Solution**: This is normal - fallback images will be used

## 💰 Cost Information

### **Current Pricing (2024):**
- **Find Place from Text**: $17 per 1,000 requests
- **Place Photos**: $7 per 1,000 requests

### **Free Tier:**
- $200 free credit monthly for new users
- Approximately 11,000+ photo requests covered by free tier

### **Cost Optimization:**
- ✅ **Caching**: Our service now caches results to prevent duplicate requests
- ✅ **Deduplication**: Removes duplicate place requests in batch processing
- ✅ **Circuit Breaker**: Stops making requests after failures
- ✅ **Rate Limiting**: Processes requests in batches with delays

## 🎯 Implementation Details

### **What Happens Now:**

1. **First Request**: API fetches real photos for unique places
2. **Subsequent Requests**: Uses cached results (no additional API calls)
3. **API Failures**: Gracefully falls back to category-based Unsplash images
4. **Duplicate Requests**: Automatically deduplicated before API calls

### **Visual Indicators:**
- ⏳ Loading spinner while fetching photos
- 📸 "Real" badge when actual place photo loads
- 🔄 Seamless fallback to Unsplash images if API fails

### **Error Handling:**
- **REQUEST_DENIED**: Disables API and uses fallbacks
- **Network Errors**: Individual failures don't affect other requests
- **No Photos Found**: Normal behavior, uses category fallbacks

## � Quick Test

After setting up your API key:

1. **Restart your app** to load the new environment variable
2. **Ask for recommendations** (e.g., "Show me restaurants in Paris")
3. **Check console logs** - should see "Found real photo for: [place name]"
4. **Look for 📸 "Real" badges** on recommendation cards

## 🛠️ Fallback Strategy

Even without Google Places API, the app works perfectly:

1. **No API Key**: Uses category-based Unsplash images
2. **API Failures**: Gracefully falls back to Unsplash
3. **Quota Exceeded**: Switches to fallback images
4. **Network Issues**: Individual failures don't break the UI

**Result**: Users always see beautiful images, whether real photos or high-quality fallbacks!

## 📞 Need Help?

If you're still seeing `REQUEST_DENIED`:

1. **Double-check**: API key is correct and properly set
2. **Verify**: Places API is enabled in your Google Cloud project
3. **Confirm**: Billing is enabled (required for Places API)
4. **Test**: Use the curl command above to test your API key directly
