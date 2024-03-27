document.addEventListener('DOMContentLoaded', function() {
    displayMarkupRate();
    loadRepaymentData();
});

function displayMarkupRate() {
    // Fetch settings from the server
    fetch('http://localhost:3000/settings')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Assuming 'markupRate' is the key in the returned object
        const markupRate = data.markupRate || '0';
        document.getElementById('markupRateDisplay').textContent = `${markupRate}%`;
    })
    .catch(error => {
        console.error('Error fetching markup rate:', error);
        document.getElementById('markupRateDisplay').textContent = 'Unable to retrieve markup from DB'
    });
}

function loadRepaymentData() {
    fetch('http://localhost:3000/orders')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        const orders = data.orders; // Adjust based on your actual API response structure
        const tableBody = document.getElementById('repaymentTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // Clear the table for new data
        
        let totalUnpaidItemCost = 0;
        let totalUnpaidShippingCost = 0;
        
        orders.forEach(order => {
            const row = tableBody.insertRow();
            
            // Item name with a clickable link
            const itemNameCell = row.insertCell(0);
            const itemNameLink = document.createElement('a');
            itemNameLink.href = "#";
            itemNameLink.textContent = order.description;
            itemNameLink.style.cursor = 'pointer';
            itemNameLink.style.textDecoration = 'underline';
            itemNameLink.addEventListener('click', (event) => {
                event.preventDefault();
                // Functionality to show total modal goes here
            });
            itemNameCell.appendChild(itemNameLink);

            row.insertCell(1).textContent = order.note;
            
            const markupRate = parseFloat(localStorage.getItem('markupRate')) || 0;
            const originalPrice = parseFloat(order.price);
            const markupAmount = originalPrice * (markupRate / 100);
            const finalPrice = originalPrice + markupAmount;
            row.insertCell(2).textContent = `$${finalPrice.toFixed(2)}`;

            const statusCell = row.insertCell(3);
            statusCell.textContent = order.status;

            // Actions cell
            const actionCell = row.insertCell(4);

            // Button to show markup details
            const showMarkupButton = document.createElement('button');
            showMarkupButton.textContent = 'Show Markup';
            showMarkupButton.classList.add('table-button');
            showMarkupButton.addEventListener('click', () => {
                showMarkupDetails(originalPrice, markupAmount, markupRate);
            });
            actionCell.appendChild(showMarkupButton);

            // Button to estimate shipping
            const estimateShippingButton = document.createElement('button');
            estimateShippingButton.textContent = 'Estimate Shipping';
            estimateShippingButton.classList.add('table-button');
            estimateShippingButton.addEventListener('click', () => {
                // Assuming a function to estimate shipping cost exists
                openShippingCostModal(order);
            });
            actionCell.appendChild(estimateShippingButton);

            // Button to toggle payment status
            const toggleStatusButton = document.createElement('button');
            toggleStatusButton.textContent = 'Toggle State'
            toggleStatusButton.classList.add('table-button')
            toggleStatusButton.addEventListener('click', () => {
                const newStatus = order.status === 'Paid' ? 'Unpaid' : 'Paid';
                fetch(`http://localhost:3000/orders/${order.id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus }),
                })
                .then(response => response.json())
                .then(() => {
                    // Refresh the data
                    loadRepaymentData();
                })
                .catch(error => console.error('Failed to update order status', error));
            });
            actionCell.appendChild(toggleStatusButton);
            
            // Calculate totals for unpaid items and shipping
            if (order.status === "Unpaid") {
                totalUnpaidItemCost += finalPrice;
                // Assuming calculateShippingCost function exists
                const shippingCost = calculateShippingCost(parseFloat(order.weight));
                totalUnpaidShippingCost += shippingCost;
            }
        });

        // Summary row for totals
        const summaryRow = tableBody.insertRow();
        summaryRow.insertCell(0).textContent = "TOTALS - UNPAID";
        summaryRow.insertCell(1).textContent = ""; // For alignment
        summaryRow.insertCell(2).textContent = `$${totalUnpaidItemCost.toFixed(2)}`;
        summaryRow.insertCell(3).textContent = `$${totalUnpaidShippingCost.toFixed(2)}`;
        const totalCostCell = summaryRow.insertCell(4);
        totalCostCell.textContent = `Total: $${(totalUnpaidItemCost + totalUnpaidShippingCost).toFixed(2)}`;
        summaryRow.style.fontWeight = 'bold';
    })
    .catch(error => console.error('Error fetching orders:', error));
}

function showMarkupDetails(originalPrice, markupAmount, markupRate) {
    document.getElementById('originalPrice').textContent = `Original Price: $${originalPrice.toFixed(2)}`;
    document.getElementById('markupAmount').textContent = `Markup Added: $${markupAmount.toFixed(2)}`;
    document.getElementById('markupRate').textContent = `Total Price: $${(originalPrice + markupAmount).toFixed(2)}`;
    toggleMarkupModal(true);
}

function toggleMarkupModal(show) {
    document.getElementById('markupModal').style.display = show ? 'block' : 'none';
}

function showTotalModal(show, event) {
    event.preventDefault();
    // Populate and display the modal with order details
    document.getElementById('itemImage').src = order.image;
    document.getElementById('itemName').textContent = 'Name: ' + order.description;
    document.getElementById('sizeOrNotes').textContent = order.note
    document.getElementById('itemWeight').textContent = 'Weight: ' + order.weight + 'g';
    
    const originalPrice = parseFloat(order.price);
    const markupRate = parseFloat(localStorage.getItem('markupRate')) || 0;
    const markupAmount = originalPrice * (markupRate / 100);
    const finalPrice = originalPrice + markupAmount;
    document.getElementById('itemPrice').textContent = 'Item Cost: $' + finalPrice.toFixed(2);
    
    const shippingCost = calculateShippingCost(parseFloat(order.weight)); // Make sure this function is defined
    document.getElementById('shippingCost').textContent = 'Shipping Cost: $' + shippingCost.toFixed(2);
    
    const totalCost = finalPrice + shippingCost;
    document.getElementById('totalCost').textContent = 'Total Cost: $' + totalCost.toFixed(2);
    
    document.getElementById('itemDetailsModal').style.display = 'block';
}

function toggleShippingModal(show) {
    document.getElementById('shippingCostModal').style.display = show ? 'block' : 'none';
}

function openShippingCostModal(order) {
    // Fetch settings from the database
    fetch('http://localhost:3000/settings')
    .then(response => response.json())
    .then(settingsData => {
        const weight = order.weight; // Using the order weight

        if (weight) {
            // Use the fetched settings for the shipping cost calculations
            const initialCost = parseFloat(settingsData.shippingInitCost); // Example of fetched data
            const additionalCost = parseFloat(settingsData.additionalCost); // Example of fetched data
            const carrierProcFee = parseFloat(settingsData.carrierProcFee); // Example of fetched data
            const operationFee = parseFloat(settingsData.operationFee); // Example of fetched data
            const weightFeeCount = weight > 100 ? Math.ceil((weight - 100) / 100) : 0;
            const shippingCost = initialCost + (weightFeeCount * additionalCost) + carrierProcFee + operationFee;

            document.getElementById('packageWeight').textContent = 'Weight: ' + weight + 'g';
            document.getElementById('initialCost').textContent = 'Initial Cost: $' + initialCost.toFixed(2);
            document.getElementById('additionalCost').textContent = 'Weight Fee ($' + additionalCost.toFixed(2) + ' per 100g): $' + (weightFeeCount * additionalCost).toFixed(2);
            document.getElementById('carrierFee').textContent = 'Australia Post Fee: $' + carrierProcFee.toFixed(2);
            document.getElementById('operationFee').textContent = 'Packaging Fee: $' + operationFee.toFixed(2);
            document.getElementById('shippingTotal').textContent = 'Total Shipping Cost: $' + shippingCost.toFixed(2);

            toggleShippingModal(true);
        } else {
            alert("Weight is required to estimate shipping."); // Consider a more integrated error handling approach
        }
    })
    .catch(error => console.error('Error fetching settings:', error));
}

function calculateShippingCost(weight) {
    const initialCost = parseFloat(localStorage.getItem('shippingInitCost')); // 5.02
    const weightFee = parseFloat(localStorage.getItem('additionalCost')); // 2.12
    const australiaPostFee = parseFloat(localStorage.getItem('carrierProcFee')); // 7.31
    const packagingFee = parseFloat(localStorage.getItem('operationFee')); // 1.99

    const weightFeeCount = weight > 100 ? Math.ceil((weight - 100) / 100) : 0;

    // Calculate total shipping cost
    const totalShippingCost = initialCost + (weightFee * weightFeeCount) + australiaPostFee + packagingFee;

    return totalShippingCost;
}