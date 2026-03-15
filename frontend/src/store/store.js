import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertyReducer from './slices/propertySlice';
import unitReducer from './slices/unitSlice';
import tenantReducer from './slices/tenantSlice';
import invoiceReducer from './slices/invoiceSlice';
import paymentReducer from './slices/paymentSlice';
import expenseReducer from './slices/expenseSlice';
import utilityReducer from './slices/utilitySlice';
import maintenanceReducer from './slices/maintenanceSlice';
import propertyGroupReducer from './slices/propertyGroupSlice';
import smsReducer from './slices/smsSlice';
import preferencesReducer from './slices/preferencesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertyReducer,
    units: unitReducer,
    tenants: tenantReducer,
    invoices: invoiceReducer,
    payments: paymentReducer,
    expenses: expenseReducer,
    utilities: utilityReducer,
    maintenance: maintenanceReducer,
    propertyGroups: propertyGroupReducer,
    sms: smsReducer,
    preferences: preferencesReducer,
  },
});
