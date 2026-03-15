const express = require('express');
const Invoice = require('../models/Invoice');
const Tenant = require('../models/Tenant');
const Property = require('../models/Property');
const Unit = require('../models/Unit');
const { auth, requireRole } = require('../middleware/auth');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');

const router = express.Router();

// Helper function to generate automatic invoice items from property/unit
function generateAutomaticInvoiceItems(property, unit, additionalItems = []) {
  const items = [];

  // Add rent (always included)
  if (unit && unit.rentAmount) {
    items.push({
      itemName: 'Rent',
      description: `Monthly rent for ${unit.unitId}`,
      amount: unit.rentAmount
    });
  }

  // Add property-level charges
  if (property) {
    if (property.waterRate) {
      items.push({
        itemName: 'Water',
        description: 'Water charges',
        amount: property.waterRate
      });
    }

    if (property.electricityRate) {
      items.push({
        itemName: 'Electricity',
        description: 'Electricity charges',
        amount: property.electricityRate
      });
    }

    if (property.garbageBill) {
      items.push({
        itemName: 'Garbage',
        description: 'Garbage collection charges',
        amount: property.garbageBill
      });
    }

    if (property.managementFee) {
      items.push({
        itemName: 'Management Fee',
        description: 'Property management fee',
        amount: property.managementFee
      });
    }

    // Add property-level other recurring bills (if unit doesn't override)
    if (property.otherRecurringBills && property.otherRecurringBills.length > 0) {
      const unitHasBills = unit && unit.otherRecurringBills && unit.otherRecurringBills.length > 0;
      
      if (!unitHasBills) {
        property.otherRecurringBills.forEach(bill => {
          if (bill.name && bill.amount) {
            items.push({
              itemName: bill.name,
              description: `Recurring charge - ${bill.name}`,
              amount: bill.amount
            });
          }
        });
      }
    }
  }

  // Add unit-level other recurring bills (overrides property-level)
  if (unit && unit.otherRecurringBills && unit.otherRecurringBills.length > 0) {
    unit.otherRecurringBills.forEach(bill => {
      if (bill.name && bill.amount) {
        items.push({
          itemName: bill.name,
          description: `Recurring charge - ${bill.name}`,
          amount: bill.amount
        });
      }
    });
  }

  // Add any additional items (for manual additions)
  if (additionalItems && additionalItems.length > 0) {
    items.push(...additionalItems);
  }

  return items;
}

// Get all invoices
router.get('/', auth, async (req, res) => {
  try {
    const { tenantId, propertyId, status, startDate, endDate } = req.query;
    let query = {};

    // If user is a tenant, only show their own invoices
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
      query.organizationId = tenant.organizationId;
    } else {
      // Managers/admins can filter by tenant, property, etc.
      query.organizationId = req.user.organizationId;
      if (tenantId) query.tenantId = tenantId;
      if (propertyId) query.propertyId = propertyId;
    }

    if (status) query.status = status;
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate);
      if (endDate) query.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(query)
      .populate('tenantId', 'firstName lastName email phoneNumber')
      .populate('propertyId', 'propertyName')
      .populate('unitId', 'unitId')
      .sort({ invoiceDate: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single invoice
router.get('/:id', auth, async (req, res) => {
  try {
    let query = { _id: req.params.id };

    // If user is a tenant, ensure they can only see their own invoices
    if (req.user.role === 'tenant') {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant record not found' });
      }
      query.tenantId = tenant._id;
      query.organizationId = tenant.organizationId;
    } else {
      query.organizationId = req.user.organizationId;
    }

    const invoice = await Invoice.findOne(query)
      .populate('tenantId')
      .populate('propertyId')
      .populate('unitId');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create invoice for single tenant
router.post('/create', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const {
      tenantId,
      invoiceDate,
      dueDate,
      items: additionalItems, // Renamed to clarify these are additional items
      notes,
      combineWithOtherInvoices
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant is required' });
    }

    // Get tenant details with populated property and unit
    const tenant = await Tenant.findOne({
      _id: tenantId,
      organizationId: req.user.organizationId
    })
      .populate('propertyId')
      .populate('unitId');

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const property = tenant.propertyId;
    const unit = tenant.unitId;

    // Generate automatic invoice items (rent + recurring charges)
    const automaticItems = generateAutomaticInvoiceItems(property, unit);
    
    // Filter and map additional items - only include valid items
    const validAdditionalItems = (additionalItems || [])
      .filter(item => item && item.itemName && item.itemName.trim() && 
                      item.amount !== null && item.amount !== undefined && item.amount !== '')
      .map(item => ({
        itemName: item.itemName.trim(),
        description: (item.description || '').trim(),
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : (item.amount || 0)
      }))
      .filter(item => item.amount > 0); // Only include items with positive amounts
    
    // Combine automatic and additional items
    const allItems = [...automaticItems, ...validAdditionalItems];

    if (allItems.length === 0) {
      return res.status(400).json({ message: 'No invoice items to generate' });
    }

    // Determine tax rate (unit-level takes precedence over property-level)
    const taxRate = unit?.taxRate !== null && unit?.taxRate !== undefined
      ? unit.taxRate
      : (property?.taxRate !== null && property?.taxRate !== undefined ? property.taxRate : 0);

    // Calculate totals
    const subtotal = allItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax = taxRate ? (subtotal * taxRate) / 100 : 0;
    const total = subtotal + tax;

    // Check for existing invoices if combining
    let existingInvoice = null;
    if (combineWithOtherInvoices && invoiceDate) {
      const month = new Date(invoiceDate).getMonth();
      const year = new Date(invoiceDate).getFullYear();
      existingInvoice = await Invoice.findOne({
        tenantId: tenantId,
        organizationId: req.user.organizationId,
        status: { $in: ['open', 'overdue'] },
        $expr: {
          $and: [
            { $eq: [{ $month: '$invoiceDate' }, month + 1] },
            { $eq: [{ $year: '$invoiceDate' }, year] }
          ]
        }
      });
    }

    if (existingInvoice) {
      // Add items to existing invoice
      existingInvoice.items = [...existingInvoice.items, ...allItems];
      existingInvoice.subtotal = existingInvoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      existingInvoice.tax = taxRate ? (existingInvoice.subtotal * taxRate) / 100 : 0;
      existingInvoice.total = existingInvoice.subtotal + existingInvoice.tax;
      if (notes) existingInvoice.notes = notes;
      
      await existingInvoice.save();
      return res.json(existingInvoice);
    }

    // Generate invoice number using property name initials
    const invoiceNumber = generateInvoiceNumber(property);

    // Create new invoice
    const invoice = new Invoice({
      organizationId: req.user.organizationId,
      tenantId: tenant._id,
      propertyId: property?._id || property,
      unitId: unit?._id || unit,
      invoiceNumber: invoiceNumber,
      invoiceDate: invoiceDate || new Date(),
      dueDate: dueDate || null,
      items: allItems,
      subtotal: subtotal,
      tax: tax,
      total: total,
      notes: notes || null,
      combineWithOtherInvoices: combineWithOtherInvoices || false,
      status: 'open'
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate invoices for all tenants
router.post('/generate-all', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const {
      propertyIds,
      invoiceDate,
      items: additionalItems, // Renamed to clarify these are additional items
      notes,
      combineWithOtherInvoices
    } = req.body;

    // Note: Automatic items (rent, recurring charges) will be generated from property/unit

    // Get all tenants for the selected properties or all properties
    const query = { organizationId: req.user.organizationId, isActive: true };
    if (propertyIds && propertyIds.length > 0) {
      query.propertyId = { $in: propertyIds };
    }

    const tenants = await Tenant.find(query)
      .populate('propertyId')
      .populate('unitId');

    if (tenants.length === 0) {
      return res.status(404).json({ message: 'No tenants found' });
    }

    const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();
    const month = invoiceDateObj.getMonth();
    const year = invoiceDateObj.getFullYear();

    const createdInvoices = [];

    for (const tenant of tenants) {
      // Check if invoice already exists for this month
      const existingInvoice = await Invoice.findOne({
        tenantId: tenant._id,
        organizationId: req.user.organizationId,
        status: { $in: ['open', 'overdue'] },
        $expr: {
          $and: [
            { $eq: [{ $month: '$invoiceDate' }, month + 1] },
            { $eq: [{ $year: '$invoiceDate' }, year] }
          ]
        }
      });

      if (existingInvoice && !combineWithOtherInvoices) {
        // Skip this tenant if invoice already exists
        continue;
      }

      const property = tenant.propertyId;
      const unit = tenant.unitId;

    // Generate automatic invoice items (rent + recurring charges)
    const automaticItems = generateAutomaticInvoiceItems(property, unit);
    
    // Filter and map additional items - only include valid items
    const validAdditionalItems = (additionalItems || [])
      .filter(item => item && item.itemName && item.itemName.trim() && 
                      item.amount !== null && item.amount !== undefined && item.amount !== '')
      .map(item => ({
        itemName: item.itemName.trim(),
        description: (item.description || '').trim(),
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : (item.amount || 0)
      }))
      .filter(item => item.amount > 0); // Only include items with positive amounts
    
    // Combine automatic and additional items
    const allItems = [...automaticItems, ...validAdditionalItems];

      if (allItems.length === 0) {
        continue; // Skip tenant if no items
      }

      // Determine tax rate (unit-level takes precedence over property-level)
      const taxRate = unit?.taxRate !== null && unit?.taxRate !== undefined
        ? unit.taxRate
        : (property?.taxRate !== null && property?.taxRate !== undefined ? property.taxRate : 0);

      // Calculate totals
      const subtotal = allItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const tax = taxRate ? (subtotal * taxRate) / 100 : 0;
      const total = subtotal + tax;

      if (existingInvoice && combineWithOtherInvoices) {
        // Add items to existing invoice
        existingInvoice.items = [...existingInvoice.items, ...allItems];
        existingInvoice.subtotal = existingInvoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        existingInvoice.tax = taxRate ? (existingInvoice.subtotal * taxRate) / 100 : 0;
        existingInvoice.total = existingInvoice.subtotal + existingInvoice.tax;
        if (notes) existingInvoice.notes = notes;
        
        await existingInvoice.save();
        createdInvoices.push(existingInvoice);
      } else {
        // Generate invoice number using property name initials
        const invoiceNumber = generateInvoiceNumber(property);

        // Create new invoice
        const invoice = new Invoice({
          organizationId: req.user.organizationId,
          tenantId: tenant._id,
          propertyId: property?._id || property,
          unitId: unit?._id || unit,
          invoiceNumber: invoiceNumber,
          invoiceDate: invoiceDateObj,
          items: allItems,
          subtotal: subtotal,
          tax: tax,
          total: total,
          notes: notes || null,
          combineWithOtherInvoices: combineWithOtherInvoices || false,
          status: 'open'
        });

        await invoice.save();
        createdInvoices.push(invoice);
      }
    }

    res.status(201).json({
      message: `Generated ${createdInvoices.length} invoice(s)`,
      count: createdInvoices.length,
      invoices: createdInvoices
    });
  } catch (error) {
    console.error('Generate all invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate invoices by lease start date
router.post('/generate-by-lease', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const {
      propertyIds,
      invoiceDate,
      leaseStartDay,
      items: additionalItems, // Renamed to clarify these are additional items
      notes,
      combineWithOtherInvoices
    } = req.body;

    if (!leaseStartDay) {
      return res.status(400).json({ 
        message: 'Lease start day is required' 
      });
    }

    // Get tenants with lease starting on the specified day
    const query = {
      organizationId: req.user.organizationId,
      isActive: true,
      leaseStartDate: { $exists: true, $ne: null }
    };

    if (propertyIds && propertyIds.length > 0) {
      query.propertyId = { $in: propertyIds };
    }

    const tenants = await Tenant.find(query)
      .populate('propertyId')
      .populate('unitId');

    // Filter tenants by lease start day
    const filteredTenants = tenants.filter(tenant => {
      if (!tenant.leaseStartDate) return false;
      const leaseDate = new Date(tenant.leaseStartDate);
      return leaseDate.getDate() === parseInt(leaseStartDay);
    });

    if (filteredTenants.length === 0) {
      return res.status(404).json({ 
        message: `No tenants found with lease starting on day ${leaseStartDay}` 
      });
    }

    const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();
    const month = invoiceDateObj.getMonth();
    const year = invoiceDateObj.getFullYear();

    const createdInvoices = [];

    for (const tenant of filteredTenants) {
      // Check if invoice already exists for this month
      const existingInvoice = await Invoice.findOne({
        tenantId: tenant._id,
        organizationId: req.user.organizationId,
        status: { $in: ['open', 'overdue'] },
        $expr: {
          $and: [
            { $eq: [{ $month: '$invoiceDate' }, month + 1] },
            { $eq: [{ $year: '$invoiceDate' }, year] }
          ]
        }
      });

      if (existingInvoice && !combineWithOtherInvoices) {
        continue;
      }

      const property = tenant.propertyId;
      const unit = tenant.unitId;

    // Generate automatic invoice items (rent + recurring charges)
    const automaticItems = generateAutomaticInvoiceItems(property, unit);
    
    // Filter and map additional items - only include valid items
    const validAdditionalItems = (additionalItems || [])
      .filter(item => item && item.itemName && item.itemName.trim() && 
                      item.amount !== null && item.amount !== undefined && item.amount !== '')
      .map(item => ({
        itemName: item.itemName.trim(),
        description: (item.description || '').trim(),
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : (item.amount || 0)
      }))
      .filter(item => item.amount > 0); // Only include items with positive amounts
    
    // Combine automatic and additional items
    const allItems = [...automaticItems, ...validAdditionalItems];

      if (allItems.length === 0) {
        continue; // Skip tenant if no items
      }

      // Determine tax rate (unit-level takes precedence over property-level)
      const taxRate = unit?.taxRate !== null && unit?.taxRate !== undefined
        ? unit.taxRate
        : (property?.taxRate !== null && property?.taxRate !== undefined ? property.taxRate : 0);

      // Calculate totals
      const subtotal = allItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      const tax = taxRate ? (subtotal * taxRate) / 100 : 0;
      const total = subtotal + tax;

      if (existingInvoice && combineWithOtherInvoices) {
        existingInvoice.items = [...existingInvoice.items, ...allItems];
        existingInvoice.subtotal = existingInvoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
        existingInvoice.tax = taxRate ? (existingInvoice.subtotal * taxRate) / 100 : 0;
        existingInvoice.total = existingInvoice.subtotal + existingInvoice.tax;
        if (notes) existingInvoice.notes = notes;
        
        await existingInvoice.save();
        createdInvoices.push(existingInvoice);
      } else {
        // Generate invoice number using property name initials
        const invoiceNumber = generateInvoiceNumber(property);

        const invoice = new Invoice({
          organizationId: req.user.organizationId,
          tenantId: tenant._id,
          propertyId: property?._id || property,
          unitId: unit?._id || unit,
          invoiceNumber: invoiceNumber,
          invoiceDate: invoiceDateObj,
          items: allItems,
          subtotal: subtotal,
          tax: tax,
          total: total,
          notes: notes || null,
          combineWithOtherInvoices: combineWithOtherInvoices || false,
          status: 'open'
        });

        await invoice.save();
        createdInvoices.push(invoice);
      }
    }

    res.status(201).json({
      message: `Generated ${createdInvoices.length} invoice(s) for tenants with lease starting on day ${leaseStartDay}`,
      count: createdInvoices.length,
      invoices: createdInvoices
    });
  } catch (error) {
    console.error('Generate by lease date error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update invoice
router.put('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    Object.assign(invoice, req.body);
    
    // Recalculate totals if items changed
    if (req.body.items) {
      invoice.subtotal = invoice.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      // Recalculate tax if needed
      if (invoice.tax || req.body.tax !== undefined) {
        // Tax calculation would depend on property tax rate
      }
      invoice.total = invoice.subtotal + (invoice.tax || 0);
    }

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete invoice
router.delete('/:id', auth, requireRole('manager', 'landlord', 'admin'), async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
