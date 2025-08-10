// Quick test to see if AJAX is working
console.log('Testing cart update functionality...');

// Test if jQuery is available
if (typeof $ !== 'undefined') {
    console.log('✅ jQuery is loaded');
} else {
    console.log('❌ jQuery is NOT loaded');
}

// Test if the sendItemCountUpdate function exists
if (typeof sendItemCountUpdate === 'function') {
    console.log('✅ sendItemCountUpdate function exists');
} else {
    console.log('❌ sendItemCountUpdate function NOT found');
}

// Test the AJAX endpoint manually
console.log('Testing AJAX endpoint...');
$.ajax({
    url: '/cart/update',
    type: 'POST',
    data: {
        items: JSON.stringify([{
            ID: 1,
            book_id: 1,
            amount: 2
        }])
    },
    success: function(response) {
        console.log('✅ AJAX success:', response);
    },
    error: function(xhr, status, error) {
        console.log('❌ AJAX error:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText,
            error: error
        });
    }
});
