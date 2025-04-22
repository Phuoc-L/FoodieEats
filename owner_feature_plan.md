# Restaurant Owner Feature Implementation Plan

This document outlines the tasks required to implement the restaurant owner functionality in the FoodieEats application.

**Task 1: Update Backend Schemas**

*   [ ] **1.1:** Add `isOwner: { type: Boolean, default: false }` to `User` schema (`Backend/data_schemas/users.js`).
*   [ ] **1.2:** Add `ownedRestaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: false }` to `User` schema.
*   [ ] **1.3:** Review `Restaurant` schema (`Backend/data_schemas/restaurant.js`) to confirm default/placeholder values can be used for required fields during automatic creation.

**Task 2: Update Backend User Routes (`Backend/routes/userRoutes.js`)**

*   [ ] **2.1:** Modify `POST /signup` to accept an `isOwner` flag from the request body.
*   [ ] **2.2:** Implement logic in `/signup`: If `isOwner` is true, create a placeholder `Restaurant` document first and get its ID.
*   [ ] **2.3:** Implement logic in `/signup`: Save the new `User` with `isOwner` status and `ownedRestaurantId` (if applicable).
*   [ ] **2.4:** Ensure `/signup` response includes `isOwner` and `ownedRestaurantId`.
*   [ ] **2.5:** Modify `POST /login` response to include `isOwner` and `ownedRestaurantId` in the returned user object.

**Task 3: Update Frontend Authentication Screen (`FoodieEats/screens/AuthScreen.js`)**

*   [ ] **3.1:** Add UI element (e.g., Switch) for "Personal" / "Owner" selection.
*   [ ] **3.2:** Add state management for the toggle.
*   [ ] **3.3:** Modify signup API call to send the `isOwner` flag.
*   [ ] **3.4:** Update login/signup success handler to save `userID`, `owner` (boolean), and `restaurantId` (if owner) to AsyncStorage.
*   [ ] **3.5:** Ensure login/signup success handler saves `token` to AsyncStorage.

**Task 4: Implement Frontend Restaurant Page**

*   [ ] **4.1:** Create `FoodieEats/screens/RestaurantPage.js` component file.
*   [ ] **4.2:** Implement component structure to accept `restaurantId` from route parameters.
*   [ ] **4.3:** Implement API call to fetch restaurant details based on `restaurantId`.
*   [ ] **4.4:** Implement logic to read logged-in user's `restaurantId` from AsyncStorage.
*   [ ] **4.5:** Implement conditional rendering for owner-specific UI elements (e.g., Edit button) by comparing the page's `restaurantId` with the AsyncStorage `restaurantId`.

**Task 5: Update Frontend Navigation**

*   [ ] **5.1:** Add `RestaurantPage` screen component to the stack navigator in `FoodieEats/App.js`.
*   [ ] **5.2:** Correct `FetchAsyncData` in `FoodieEats/screens/Navigation.js` to properly fetch/store `userID`, `owner` (as boolean), and `restaurantId`.
*   [ ] **5.3:** Correct profile icon logic in `Navigation.js` to navigate to `RestaurantPage` with `restaurantId` param for owners.
*   [ ] **5.4:** Correct profile icon logic in `Navigation.js` to navigate to `Profile` with fetched `userID` param for regular users.
*   [ ] **5.5:** Verify conditional display logic for nav icons (Home, New Post) based on `isOwner` in `Navigation.js`.

**Task 6: Finalize and Cleanup**

*   [ ] **6.1:** Implement/verify logout functionality clears `userID`, `owner`, `restaurantId`, `token` from AsyncStorage.
*   [ ] **6.2:** Add error handling for new/modified API calls and AsyncStorage operations.
*   [ ] **6.3:** Perform end-to-end testing for both user and owner signup/login/navigation flows.