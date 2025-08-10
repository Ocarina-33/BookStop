// libraries
const express = require('express');
// creating router
const router = express.Router({mergeParams : true});

const DB_voucher = require('../../../Database/DB-voucher-api');
const DB_publisher = require('../../../Database/DB-publisher-api');
const DB_notification = require('../../../Database/DB-notification-api');

router.get('/', async (req, res) =>{
    console.log('=== MAIN VOUCHER ROUTE ACCESSED ===');
    console.log('Admin logged in:', req.admin ? 'Yes' : 'No');
    
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        const vouchersResult = await DB_voucher.getAllVoucher();
        res.render('adminLayout.ejs', {
            title:'Vouchers',
            page:'adminVoucherAll',
            vouchers:vouchersResult
        });
    } catch (error) {
        console.error('Error fetching vouchers:', error);
        res.render('adminLayout.ejs', {
            title:'Vouchers',
            page:'adminVoucherAll',
            vouchers:[],
            error: 'Error fetching vouchers'
        });
    }
});

// TEST ROUTE - No auth required
router.get('/test-route', (req, res) => {
    console.log('=== TEST ROUTE HIT ===');
    res.send('<h1>TEST ROUTE WORKS!</h1><p>Admin auth working!</p>');
});

// Another test with auth
router.get('/test-auth', (req, res) => {
    console.log('=== AUTH TEST ROUTE HIT ===');
    console.log('Admin session:', req.admin);
    if (req.admin == null) {
        return res.send('<h1>NOT AUTHENTICATED</h1><p>Admin session not found</p>');
    }
    res.send('<h1>AUTHENTICATED!</h1><p>Admin session found</p>');
});

// Voucher management page (MUST be before /edit/:id to avoid route conflict)
router.get('/manage/:id', async (req, res) => {
    console.log('=== MANAGE ROUTE HIT ===');
    console.log('URL:', req.url);
    console.log('Params:', req.params);
    console.log('Admin session:', req.admin);
    
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const voucherResult = await DB_voucher.getVoucherById(req.params.id);
        if (voucherResult.length === 0) {
            return res.redirect('/admin/voucher?error=Voucher not found');
        }
        
        const distributionHistory = await DB_voucher.getVoucherDistributionHistory(req.params.id);
        console.log('Distribution history:', distributionHistory);
        
        res.render('adminLayout.ejs', {
            title: `Manage Voucher: ${voucherResult[0].name}`,
            page: 'adminVoucherManage',
            voucher: voucherResult[0],
            distributionHistory: distributionHistory
        });
    } catch (error) {
        console.error('Error fetching voucher management data:', error);
        return res.redirect('/admin/voucher?error=Error loading voucher management page');
    }
});

router.get('/edit/:id', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        const voucherResult = await DB_voucher.getVoucherById(req.params.id);
        if( voucherResult.length === 0 ) {
            return res.redirect('/admin/voucher?error=Voucher not found');
        }
        
        res.render('adminLayout.ejs', {
            title:'Edit Voucher',
            page:'adminVoucherEdit',
            voucher:voucherResult[0]
        });
    } catch (error) {
        console.error('Error fetching voucher:', error);
        return res.redirect('/admin/voucher?error=Error fetching voucher details');
    }
});
router.get('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');

    res.render('adminLayout.ejs', {
        title:'Add Voucher',
        page:'adminVoucherAdd'
    });
});
router.post('/add', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        console.log(req.body);
        const {name, discount, cap, validity} = req.body;
        
        // Basic validation
        if (!name || !discount || !cap || !validity) {
            return res.render('adminLayout.ejs', {
                title:'Add Voucher',
                page:'adminVoucherAdd',
                error: 'All fields are required'
            });
        }
        
        await DB_voucher.createVoucher(name, discount, validity, cap);
        return res.redirect('/admin/voucher?success=Voucher added successfully');
    } catch (error) {
        console.error('Error adding voucher:', error);
        return res.render('adminLayout.ejs', {
            title:'Add Voucher',
            page:'adminVoucherAdd',
            error: 'Error adding voucher: ' + error.message
        });
    }
});

router.post('/edit', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        const {id, name, discount, cap, validity} = req.body;
        
        // Basic validation
        if (!id || !name || !discount || !cap || !validity) {
            return res.render('adminLayout.ejs', {
                title:'Edit Voucher',
                page:'adminVoucherEdit',
                error: 'All fields are required',
                voucher: req.body
            });
        }
        
        await DB_voucher.updateVoucher(id, name, discount, validity, cap);
        return res.redirect('/admin/voucher?success=Voucher updated successfully');
    } catch (error) {
        console.error('Error updating voucher:', error);
        return res.render('adminLayout.ejs', {
            title:'Edit Voucher',
            page:'adminVoucherEdit',
            error: 'Error updating voucher: ' + error.message,
            voucher: req.body
        });
    }
});

router.post('/delete', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        const {id} = req.body;
        
        if (!id) {
            return res.redirect('/admin/voucher?error=Voucher ID is required');
        }
        
        await DB_voucher.deleteVoucher(id);
        return res.redirect('/admin/voucher?success=Voucher deleted successfully');
    } catch (error) {
        console.error('Error deleting voucher:', error);
        return res.redirect('/admin/voucher?error=Error deleting voucher');
    }
});

router.post('/delete/:id', async (req, res) =>{
    // if logged in, delete token from database
    if( req.admin == null )
        return res.redirect('/admin/login');
    
    try {
        await DB_voucher.deleteVoucher(req.params.id);
        return res.redirect('/admin/voucher?success=Voucher deleted successfully');
    } catch (error) {
        console.error('Error deleting voucher:', error);
        return res.redirect('/admin/voucher?error=Error deleting voucher');
    }
});

// Send voucher page route
router.get('/send/:id', async (req, res) => {
    // Check if admin is logged in
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const voucherResult = await DB_voucher.getVoucherById(req.params.id);
        if (voucherResult.length === 0) {
            return res.redirect('/admin/voucher?error=Voucher not found');
        }
        
        const voucher = voucherResult[0];
        
        // Check if voucher is still valid
        const today = new Date();
        const validityDate = new Date(voucher.validity);
        if (validityDate < today) {
            return res.redirect('/admin/voucher?error=Cannot send expired voucher');
        }
        
        res.render('adminLayout.ejs', {
            title: 'Send Voucher to Users',
            page: 'adminVoucherSend',
            voucher: voucher
        });
    } catch (error) {
        console.error('Error fetching voucher for sending:', error);
        return res.redirect('/admin/voucher?error=Error loading voucher details');
    }
});

// Send voucher POST route
router.post('/send/:id', async (req, res) => {
    // Check if admin is logged in
    if (req.admin == null) {
        return res.redirect('/admin/login');
    }
    
    try {
        const voucherId = req.params.id;
        const { userIds, title, message } = req.body;
        
        // Validation
        if (!userIds || userIds.length === 0) {
            return res.redirect(`/admin/voucher/send/${voucherId}?error=Please select at least one user`);
        }
        
        if (!title || !message) {
            return res.redirect(`/admin/voucher/send/${voucherId}?error=Title and message are required`);
        }
        
        // Get voucher details
        const voucherResult = await DB_voucher.getVoucherById(voucherId);
        if (voucherResult.length === 0) {
            return res.redirect('/admin/voucher?error=Voucher not found');
        }
        
        const voucher = voucherResult[0];
        
        // Ensure userIds is an array
        const userIdArray = Array.isArray(userIds) ? userIds : [userIds];
        
        // Send voucher to each selected user
        let successCount = 0;
        for (const userId of userIdArray) {
            try {
                console.log(`Attempting to send voucher to user ID: ${userId}`);
                
                // First, assign the voucher to the user
                const assignResult = await DB_voucher.assignVoucherToUser(
                    parseInt(userId),
                    parseInt(voucherId)
                );
                
                // Then send notification with voucher details
                const result = await DB_notification.createNotification(
                    parseInt(userId),
                    title,
                    message,
                    'voucher',
                    parseInt(voucherId)
                );
                
                console.log(`Voucher assigned and notification sent to user ${userId}, notification ID: ${result.id}`);
                successCount++;
            } catch (error) {
                console.error(`Error sending voucher to user ${userId}:`, error);
                // Continue with other users even if one fails
            }
        }
        
        console.log(`Successfully sent voucher to ${successCount} out of ${userIdArray.length} users`);
        
        return res.redirect(`/admin/voucher?success=Voucher sent successfully to ${userIdArray.length} user(s)`);
    } catch (error) {
        console.error('Error sending voucher:', error);
        return res.redirect(`/admin/voucher/send/${req.params.id}?error=Error sending voucher. Please try again.`);
    }
});

// Revoke voucher from specific user
router.post('/revoke-user/:id', async (req, res) => {
    if (req.admin == null) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    try {
        const distributionId = req.body.distributionId;
        
        if (!distributionId) {
            return res.status(400).json({ success: false, message: 'Distribution ID is required' });
        }
        
        const result = await DB_notification.revokeVoucherFromUser(distributionId);
        
        console.log(`Admin revoked voucher distribution ${distributionId}`);
        
        res.json({ 
            success: true, 
            message: result.message
        });
    } catch (error) {
        console.error('Error revoking voucher from user:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error revoking voucher. Please try again.' 
        });
    }
});

// Revoke voucher from all users
router.post('/revoke-all/:id', async (req, res) => {
    if (req.admin == null) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    try {
        const voucherId = req.params.id;
        
        const result = await DB_notification.revokeVoucherFromAllUsers(voucherId);
        
        console.log(`Admin revoked voucher ${voucherId} from all users`);
        
        res.json({ 
            success: true, 
            message: result.message
        });
    } catch (error) {
        console.error('Error revoking voucher from all users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error revoking voucher. Please try again.' 
        });
    }
});


module.exports = router;